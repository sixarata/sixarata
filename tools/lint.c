// lint.c — native port of the Sixarata semicolon linter (behavior-equivalent to lint.sh)

#define _DARWIN_C_SOURCE
#define _POSIX_C_SOURCE 200809L

#include <ctype.h>
#include <dirent.h>
#include <errno.h>
#include <limits.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/wait.h>
#include <unistd.h>

typedef struct {
    char **data;
    size_t len, cap;
} strvec;

/* ---- Options ----
   Default: require semicolons after `return`.
   Pass --allow-return-no-semi to revert.
*/
static int OPT_REQUIRE_RETURN_SEMI = 1;

/* ---- Utils ---- */
static void die(const char *fmt, ...) {
    va_list ap; va_start(ap, fmt);
    vfprintf(stderr, fmt, ap);
    va_end(ap);
    fputc('\n', stderr);
    exit(2);
}

static void *xmalloc(size_t n) {
    void *p = malloc(n);
    if (!p) die("Out of memory");
    return p;
}
static char *xstrdup(const char *s) {
    size_t n = strlen(s)+1;
    char *p = xmalloc(n);
    memcpy(p, s, n);
    return p;
}
static void strvec_init(strvec *v){ v->data=NULL; v->len=0; v->cap=0; }
static void strvec_push(strvec *v, const char *s){
    if (v->len==v->cap){ v->cap = v->cap? v->cap*2:16; v->data = realloc(v->data, v->cap*sizeof(char*)); if(!v->data) die("OOM"); }
    v->data[v->len++] = xstrdup(s);
}
static void strvec_free(strvec *v){
    for(size_t i=0;i<v->len;i++) free(v->data[i]);
    free(v->data);
}

static bool ends_with(const char *s, const char *suffix){
    size_t n=strlen(s), m=strlen(suffix);
    return n>=m && memcmp(s+n-m, suffix, m)==0;
}
static bool file_exists(const char *p){ struct stat st; return stat(p,&st)==0 && S_ISREG(st.st_mode); }
static bool has_js_ext(const char *p){ return ends_with(p,".js"); }

static char *dirname_of_exe(const char *argv0){
    char buf[PATH_MAX];
    const char *path = argv0;
    if (!strchr(argv0,'/')) {
        char *pathenv = getenv("PATH");
        if (pathenv) {
            char *paths = xstrdup(pathenv), *save=paths;
            for(char *tok=strtok(paths, ":"); tok; tok=strtok(NULL, ":")){
                snprintf(buf,sizeof(buf), "%s/%s", tok, argv0);
                if (file_exists(buf)) { path = buf; break; }
            }
            free(save);
        }
    }
    char real[PATH_MAX];
    if (realpath(path, real)==NULL) {
        if (!getcwd(real, sizeof(real))) die("getcwd failed");
    }
    char *slash = strrchr(real, '/');
    if (slash) *slash = '\0';
    return xstrdup(real);
}

static char *ltrim(char *s){
    while (*s && isspace((unsigned char)*s)) s++;
    return s;
}
static void rtrim_inplace(char *s){
    size_t n=strlen(s);
    while (n>0 && isspace((unsigned char)s[n-1])) n--;
    s[n]='\0';
}

/* ---- Comment splitting (ignore ://) ---- */
static void split_trailing_inline_comment(const char *line, char **code_out, char **comment_out){
    size_t n=strlen(line);
    const char *prev = NULL;
    for (size_t i=0;i+1<n;i++){
        if (line[i]=='/' && line[i+1]=='/' && (!prev || *prev!=':')){
            char *code = xmalloc(i+1);
            memcpy(code, line, i);
            code[i]='\0';
            rtrim_inplace(code);
            *code_out = code;
            *comment_out = xstrdup(line+i);
            return;
        }
        prev = &line[i];
    }
    *code_out = xstrdup(line);
    *comment_out = xstrdup("");
}

static int count_char(const char *s, char c){
    int k=0; for (; *s; ++s) if (*s==c) ++k; return k;
}
static void depth_deltas(const char *code, int *dp,int *db,int *dc){
    int p=0,b=0,c=0;
    for (const char *x=code; *x; ++x){
        switch(*x){
            case '(': ++p; break; case ')': --p; break;
            case '[': ++b; break; case ']': --b; break;
            case '{': ++c; break; case '}': --c; break;
        }
    }
    *dp=p; *db=b; *dc=c;
}

static bool starts_return_paren(const char *trim){
    if (strncmp(trim,"return",6)!=0) return false;
    const char *p=trim+6;
    while (*p && isspace((unsigned char)*p)) ++p;
    return *p=='(';
}

/* ---- Ignorable line logic ---- */
static bool is_blank_after_comment(const char *trimmed){
    char *code=NULL,*comm=NULL;
    split_trailing_inline_comment(trimmed, &code, &comm);
    bool blank=true;
    for (char *p=code; *p; ++p){ if (!isspace((unsigned char)*p)){ blank=false; break; } }
    free(code); free(comm);
    return blank;
}
static bool is_comment_only(const char *trimmed){
    return trimmed[0] && trimmed[0]=='/' && trimmed[1]=='/';
}
static bool starts_jsdoc_star(const char *trimmed){
    if (trimmed[0]=='*') return true;
    if (strncmp(trimmed,"/**",3)==0) return true;
    return false;
}

static bool starts_keyword_no_semi(const char *code){
    if (strncmp(code,"if ",3)==0 || strncmp(code,"if(",3)==0) return true;
    if (strncmp(code,"for ",4)==0 || strncmp(code,"for(",4)==0) return true;
    if (strncmp(code,"while ",6)==0 || strncmp(code,"while(",6)==0) return true;
    if (strncmp(code,"switch ",7)==0 || strncmp(code,"switch(",7)==0) return true;
    if (strcmp(code,"else")==0 || strncmp(code,"else ",5)==0) return true;
    if (strncmp(code,"try",3)==0) return true;
    if (strncmp(code,"catch",5)==0) return true;
    if (strncmp(code,"finally",7)==0) return true;

    if (strncmp(code,"class ",6)==0) return true;
    if (strncmp(code,"export ",7)==0 || strncmp(code,"export{",7)==0) return true;
    if (strncmp(code,"import ",7)==0 || strncmp(code,"import(",7)==0) return true;

    if (strncmp(code,"function ",9)==0) return true;
    if (strncmp(code,"async function ",15)==0) return true;

    /* return defaults to requiring a semicolon */
    if (strncmp(code,"return ",7)==0 || strncmp(code,"return(",7)==0)
        return OPT_REQUIRE_RETURN_SEMI ? false : true;

    if (strncmp(code,"throw ",6)==0) return true;
    if (strncmp(code,"break",5)==0) return true;
    if (strncmp(code,"continue",8)==0) return true;
    if (strncmp(code,"yield",5)==0) return true;
    if (strncmp(code,"await ",6)==0) return true;

    return false;
}

static bool has_trailing_structural(const char *code){
    size_t n=strlen(code);
    if (n==0) return true;
    char last = code[n-1];
    if (last==';' || last=='{' || last=='}' || last==':' || last==',' || last=='(') return true;
    if (n>=2 && code[n-2]=='=' && last=='>') return true;
    return false;
}

static bool is_ignorable_line_logic(const char *line){
    char *dup = xstrdup(line);
    char *trim = ltrim(dup);

    /* full-line blank or comment (// …) after stripping inline comment */
    if (is_blank_after_comment(trim)) { free(dup); return true; }

    /* JSDoc *-style and block comment starters */
    if (starts_jsdoc_star(trim) || is_comment_only(trim)) { free(dup); return true; }
    if (strncmp(trim, "/*", 2) == 0) { free(dup); return true; } /* ignore block comments */

    /* bare const|let|var line */
    if (strcmp(trim,"const")==0 || strcmp(trim,"let")==0 || strcmp(trim,"var")==0) { free(dup); return true; }

    /* evaluate trailing structure on code-only */
    char *code=NULL,*comm=NULL;
    split_trailing_inline_comment(trim, &code, &comm);
    bool ign = starts_keyword_no_semi(code) || has_trailing_structural(code);
    free(code); free(comm); free(dup);
    return ign;
}

/* ---- Semicolon need check on code-only ---- */
static bool needs_semicolon_codeonly(const char *code){
    size_t n = strlen(code);
    if (n==0) return true;
    if (code[n-1]==';') return false;
    if (n>=2){
        if (code[n-2]=='+' && code[n-1]=='+') return true;
        if (code[n-2]=='-' && code[n-1]=='-') return true;
    }
    char last = code[n-1];
    if (isalnum((unsigned char)last) || last=='_' || last==')' || last==']' || last=='"' || last=='\'' || last=='`'){
        return true;
    }
    if (last==',') return false;
    return true;
}

/* ---- Core: process one file ---- */
static int process_file(const char *path, bool fix_mode, strvec *missing_out) {
    FILE *fp = fopen(path, "r");
    if (!fp) { fprintf(stderr, "Skipping unreadable file %s: %s\n", path, strerror(errno)); return 0; }

    /* read all lines (without trailing newline) */
    strvec lines; strvec_init(&lines);
    char *buf=NULL; size_t bufsz=0; ssize_t r;
    while ((r=getline(&buf,&bufsz,fp))!=-1) {
        size_t n = (size_t)r;
        while (n>0 && (buf[n-1]=='\n' || buf[n-1]=='\r')) n--;
        char save = buf[n]; buf[n]='\0';
        strvec_push(&lines, buf);
        buf[n]=save;
    }
    free(buf); fclose(fp);

    FILE *fix = NULL;
    char tmpname[PATH_MAX];
    if (fix_mode) {
        snprintf(tmpname, sizeof(tmpname), "%s.autofix.tmp", path);
        fix = fopen(tmpname, "w");
        if (!fix){ fprintf(stderr, "Cannot create %s: %s\n", tmpname, strerror(errno)); strvec_free(&lines); return 1; }
    }

    int in_var_block=0, in_cond_block=0, cond_paren_depth=0;
    int in_return_block=0, return_paren_depth=0;
    int paren_depth=0, bracket_depth=0; /* {} not used for suppression */

    for (size_t i=0;i<lines.len;i++){
        const char *raw = lines.data[i];
        const char *next = (i+1<lines.len)? lines.data[i+1] : "";
        int lineno = (int)i+1;

        char *nextdup = xstrdup(next);
        char *next_trimmed = ltrim(nextdup);

        /* split once */
        char *code=NULL,*comment=NULL;
        split_trailing_inline_comment(raw, &code, &comment);

        /* 1) Update depths for this line's code (so []/() contexts apply immediately) */
        {
            int dp=0,db=0,dc=0;
            depth_deltas(code,&dp,&db,&dc);
            paren_depth+=dp;
            bracket_depth+=db;
            (void)dc; /* braces tracked but unused */
        }

        /* 2) Decide suppression */
        int suppress = 0;

        /* continuation only for () and [] — NOT for {} blocks */
        if (paren_depth>0 || bracket_depth>0) suppress = 1;

        /* commas indicate continuation */
        size_t clen = strlen(code);
        if (!suppress && clen>0 && code[clen-1]==',') suppress = 1;

        /* operator-at-line-end indicates continuation (string/expr splits) */
        if (!suppress && clen>0) {
            char last = code[clen-1];
            if (last=='+' || last=='-' || last=='*' || last=='/' || last=='%' ||
                last=='^' || last=='|' || last=='&') {
                suppress = 1;
            }
        }

        /* next line starting with ) or ] indicates continuation (but NOT }) */
        if (!suppress) {
            char c0 = next_trimmed[0];
            if (c0==')' || c0==']') suppress = 1;
        }

        /* NEW: if next line begins with logical && or ||, continuation */
        if (!suppress) {
            if ((next_trimmed[0]=='&' && next_trimmed[1]=='&') ||
                (next_trimmed[0]=='|' && next_trimmed[1]=='|')) {
                suppress = 1;
            }
        }

        /* NEW: if next line begins with a binary operator (+ - * / % ^ | &), continuation */
        if (!suppress) {
            char c0 = next_trimmed[0];
            if (c0=='+' || c0=='-' || c0=='*' || c0=='/' || c0=='%' || c0=='^' || c0=='|' || c0=='&') {
                suppress = 1;
            }
        }

        /* legacy lookahead for ')': if next is ')' and current isn't ',' or ';' */
        if (!suppress && next_trimmed[0]==')') {
            size_t nraw=strlen(raw);
            bool nonblank=false; for (size_t k=0;k<nraw;k++) if (!isspace((unsigned char)raw[k])) { nonblank=true; break; }
            if (nonblank && nraw>0 && raw[nraw-1]!=',' && raw[nraw-1]!=';') suppress=1;
        }

        /* const|let|var block */
        char *trimdup = xstrdup(raw);
        char *trimmed = ltrim(trimdup);

        if (!in_var_block) {
            if (strcmp(trimmed,"const")==0 || strcmp(trimmed,"let")==0 || strcmp(trimmed,"var")==0) {
                in_var_block=1;
            }
        }
        if (in_var_block) {
            if (strchr(raw,';')) in_var_block=0;
            suppress=1;
        }

        /* if/while/for/else if (...) paren tracking */
        if (!in_cond_block){
            char *check = ltrim(trimmed);
            while (*check=='}') check++;
            check = ltrim(check);
            bool starts=false;
            if (!strncmp(check,"if",2) && (check[2]==' '||check[2]=='(')) starts=true;
            if (!strncmp(check,"while",5) && (check[5]==' '||check[5]=='(')) starts=true;
            if (!strncmp(check,"for",3) && (check[3]==' '||check[3]=='(')) starts=true;
            if (!strncmp(check,"else if",7)) starts=true;
            if (starts){
                int opens=count_char(trimmed,'('), closes=count_char(trimmed,')');
                cond_paren_depth = opens - closes;
                if (cond_paren_depth>0){ in_cond_block=1; suppress=1; }
            }
        } else {
            cond_paren_depth += count_char(trimmed,'(') - count_char(trimmed,')');
            suppress=1;
            if (cond_paren_depth<=0) in_cond_block=0;
        }

        /* return ( ... ) tracking */
        if (!in_return_block){
            if (starts_return_paren(trimmed)){
                int ro=count_char(trimmed,'('), rc=count_char(trimmed,')');
                return_paren_depth = ro - rc;
                if (return_paren_depth>0) in_return_block=1;
            }
        } else {
            return_paren_depth += count_char(trimmed,'(') - count_char(trimmed,')');
            suppress=1;
            if (return_paren_depth<=0) in_return_block=0;
        }

        /* logical ||/&& and ternary ?/: on the current line text */
        if (!suppress) {
            if (strcmp(trimmed,"||")==0 || strcmp(trimmed,"&&")==0) suppress=1;
            size_t tlen=strlen(trimmed);
            if (!suppress && tlen>=2 && ((trimmed[tlen-2]=='|' && trimmed[tlen-1]=='|') || (trimmed[tlen-2]=='&' && trimmed[tlen-1]=='&'))) suppress=1;
            if (!suppress && (next_trimmed[0]=='?' || next_trimmed[0]==':')) suppress=1;
            if (!suppress && (trimmed[0]=='?' || trimmed[0]==':')) suppress=1;
        }

        /* report / fix */
        if (!suppress){
            if (!is_ignorable_line_logic(raw) && needs_semicolon_codeonly(code)){
                char bufline[PATH_MAX+64];
                snprintf(bufline,sizeof(bufline), "%s:%d", path, lineno);
                strvec_push(missing_out, bufline);
                if (fix_mode){
                    if (comment && *comment)
                        fprintf(fix, "%s;%s\n", code, comment);
                    else
                        fprintf(fix, "%s;\n", code);
                }
            } else {
                if (fix_mode) {
                    fputs(raw, fix);
                    fputc('\n', fix);
                }
            }
        } else {
            if (fix_mode) {
                fputs(raw, fix);
                fputc('\n', fix);
            }
        }

        free(code); free(comment); free(trimdup); free(nextdup);
    }

    if (fix_mode){
        fclose(fix);
        if (rename(tmpname, path)!=0){
            fprintf(stderr, "Failed to replace %s: %s\n", path, strerror(errno));
            unlink(tmpname);
            strvec_free(&lines);
            return 1;
        }
    }

    strvec_free(&lines);
    return 0;
}

/* ---- Discovery ---- */
static void add_js_recursive(const char *root, strvec *out){
    DIR *d = opendir(root);
    if (!d) return;
    struct dirent *de;
    char path[PATH_MAX];
    while ((de=readdir(d))){
        if (!strcmp(de->d_name,".") || !strcmp(de->d_name,"..")) continue;
        snprintf(path,sizeof(path), "%s/%s", root, de->d_name);
        struct stat st; if (stat(path,&st)!=0) continue;
        if (S_ISDIR(st.st_mode)){
            add_js_recursive(path, out);
        } else if (S_ISREG(st.st_mode)){
            if (has_js_ext(path)) strvec_push(out, path);
        }
    }
    closedir(d);
}
static void gather_staged_js(strvec *out){
    FILE *pp = popen("git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git diff --cached --name-only --diff-filter=ACMR", "r");
    if (!pp) return;
    char line[PATH_MAX];
    while (fgets(line,sizeof(line),pp)){
        size_t n=strlen(line);
        while (n>0 && (line[n-1]=='\n' || line[n-1]=='\r')) line[--n]='\0';
        if (n==0) continue;
        if (!has_js_ext(line)) continue;
        if (!file_exists(line)) continue;
        strvec_push(out, line);
    }
    pclose(pp);
}

/* ---- Main ---- */
int main(int argc, char **argv){
    bool fix=false, staged=false;
    strvec files; strvec_init(&files);

    for (int i=1;i<argc;i++){
        const char *a=argv[i];
        if (!strcmp(a,"fix")) { fix=true; }
        else if (!strcmp(a,"check")) { fix=false; }
        else if (!strcmp(a,"--staged") || !strcmp(a,"--cached")) { staged=true; }
        else if (!strcmp(a,"--allow-return-no-semi")) { OPT_REQUIRE_RETURN_SEMI = 0; }
        else if (!strcmp(a,"-h") || !strcmp(a,"--help")) {
            printf(
"Usage:\n"
"  ./lint [check]                # run check (non-zero exit on violations)\n"
"  ./lint fix                    # attempt auto-fix (adds missing trailing semicolons heuristically)\n"
"  ./lint --staged               # only lint staged *.js files (auto-detect mode=check)\n"
"  ./lint fix --staged           # auto-fix only staged *.js files\n"
"  ./lint check file1.js file2.js  # limit to specific files\n"
"Options:\n"
"  --allow-return-no-semi        # do NOT require semicolons after `return`\n");
            return 0;
        } else if (!strcmp(a,"--")) {
            for (int j=i+1;j<argc;j++) strvec_push(&files, argv[j]);
            break;
        } else if (a[0]=='-') {
            die("Unknown flag: %s", a);
        } else {
            strvec_push(&files, a);
        }
    }

    /* If explicit files were provided, ignore staged (match Bash) */
    if (files.len>0) staged=false;

    /* Resolve default or staged lists when files not given */
    if (files.len==0){
        if (staged){
            gather_staged_js(&files);
        }
        if (files.len==0){
            char *exe_dir = dirname_of_exe(argv[0]);
            char scripts[PATH_MAX]; snprintf(scripts,sizeof(scripts), "%s/../scripts", exe_dir);
            add_js_recursive(scripts, &files);
            free(exe_dir);
        }
    }

    if (files.len==0){
        fprintf(stderr, "No JavaScript files to lint.\n");
        return 0;
    }

    /* Filter to *.js and existing files */
    strvec js; strvec_init(&js);
    for (size_t i=0;i<files.len;i++){
        const char *f = files.data[i];
        if (!has_js_ext(f)) continue;
        if (!file_exists(f)) { fprintf(stderr, "Skipping missing file %s\n", f); continue; }
        strvec_push(&js, f);
    }
    strvec_free(&files);
    if (js.len==0){
        fprintf(stderr, "No JavaScript files to lint.\n");
        strvec_free(&js);
        return 0;
    }

    /* Run */
    strvec missing; strvec_init(&missing);
    for (size_t i=0;i<js.len;i++){
        process_file(js.data[i], fix, &missing);
    }

    if (missing.len>0){
        fprintf(stderr, "Missing semicolons detected:\n");
        for (size_t i=0;i<missing.len;i++) fprintf(stderr, "  %s\n", missing.data[i]);
        if (fix){
            fprintf(stderr, "Auto-fix applied where heuristic matched. Review changes.\n");
            strvec_free(&missing); strvec_free(&js);
            return 0;
        } else {
            fprintf(stderr, "Run ./lint fix to attempt automatic insertion.\n");
            strvec_free(&missing); strvec_free(&js);
            return 1;
        }
    } else {
        fprintf(stderr, "No missing semicolons detected.\n");
        strvec_free(&missing); strvec_free(&js);
        return 0;
    }
}