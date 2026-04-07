path = '/home/ubuntu/aria/app/aria.py'
with open(path, 'r') as f:
    content = f.read()

marker = '# \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n# SIDEBAR'

auto_source = '''# \u2500\u2500\u2500 AUTO-CHARGEMENT PREMI\u00c8RE SOURCE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nif not st.session_state.mcd and "auto_source_init" not in st.session_state:
    st.session_state.auto_source_init = True
    _sources = charger_sources()
    if _sources:
        _s = _sources[0]
        if os.path.exists(os.path.normpath(_s["path"])) and charger_mcd(_s["label"]):
            charger_source(_s)
            st.session_state.page = "app"
            st.rerun()
    else:
        st.session_state.page = "parametres"

'''

if 'auto_source_init' in content:
    print('Deja present, rien a faire')
else:
    new_content = content.replace(marker, auto_source + marker, 1)
    if new_content == content:
        print('MARKER NOT FOUND')
        # Fallback: chercher juste # SIDEBAR
        idx = content.find('\n# SIDEBAR\n')
        if idx >= 0:
            new_content = content[:idx+1] + auto_source + content[idx+1:]
            with open(path, 'w') as f:
                f.write(new_content)
            print('Patch applique via fallback OK')
        else:
            print('ECHEC: marker introuvable')
    else:
        with open(path, 'w') as f:
            f.write(new_content)
        print('Patch applique OK')
