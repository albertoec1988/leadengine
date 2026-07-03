#!/usr/bin/env bash
# ------------------------------------------------------------------
# Descarga de imagenes de las PAGINAS INTERNAS de floridianfirstrealty.com
# (Nosotros/Equipo, Listados, Blog)
# Uso:   bash descargar-imagenes-internas.sh
# Resultado: se guardan en ./imagenes/internas/
# ------------------------------------------------------------------
set -e
cd "$(dirname "$0")"
mkdir -p imagenes/internas
DL="curl -L -s -o"   # si no tienes curl, usa: wget -O
d () { echo "  -> $2"; $DL "imagenes/internas/$2" "$1"; }
B="https://static.wixstatic.com/media/"

echo "== Equipo (/about-1) =="
d "${B}57766a_19190ec7641a4f9792261da6f19428ad~mv2.jpg" "equipo-01.jpg"
d "${B}57766a_4b10253d953545a09d7a54924ebe50ad~mv2.jpg" "equipo-02.jpg"
d "${B}57766a_a8627d393ee54d40bc910de4fb8b2415~mv2.jpg" "equipo-03.jpg"
d "${B}57766a_22a16be75b79482fa9c91eaf10b893b5~mv2.jpg" "equipo-04.jpg"
d "${B}57766a_354c17aa41d7413894930f3671fb8b0e~mv2.jpg" "equipo-05.jpg"
d "${B}57766a_506da0ea2c864f2c89948caeb695f722~mv2.jpg" "equipo-06.jpg"
d "${B}57766a_b179c91dbe53484db6327cf20caadf5f~mv2.jpg" "equipo-07.jpg"
d "${B}57766a_6872fdca5524442093914d1355f5d41f~mv2.jpg" "equipo-08.jpg"
d "${B}57766a_5754f3f105ad4287aa2c81bb71678b5a~mv2.jpg" "equipo-09-karen.jpg"
d "${B}57766a_d95de5bd35ba4effbbc1919ba1cf33a7~mv2.jpg" "equipo-10.jpg"
d "${B}57766a_cc8f67c17b234bdcad7ab2b72a437f8c~mv2.jpg" "equipo-11.jpg"
d "${B}57766a_23f6e1d713ed40c38a079f95ba3b0ab4~mv2.jpg" "equipo-12.jpg"
d "${B}57766a_29fe7d535acd42efb0bc30c0b5f757ae~mv2.jpg" "equipo-13.jpg"
d "${B}57766a_fe74e1347ecf4092941b00cb026da28f~mv2.jpg" "equipo-14.jpg"
d "${B}57766a_76235105d89f402d94bbca050ab8b5b5~mv2.jpg" "equipo-15.jpg"
d "${B}57766a_cfd3e1b4073649b1818a796c44f2878f~mv2.jpg" "equipo-16.jpg"
d "${B}57766a_7dac9dc74f834d46aa7bad55e73251f9~mv2.jpg" "equipo-17.jpg"

echo "== Listados (/ffr-listings) =="
d "${B}57766a_a947c17f7136446cae684ddf91e1e6a0~mv2.png" "listado-01.png"
d "${B}57766a_7dfe4ba5f7b145ddadd4f5bdce1418f4~mv2.png" "listado-02.png"
d "${B}57766a_55f235a3f7dc4e24b782d67346469439~mv2.png" "listado-03.png"
d "${B}57766a_66eaf7c0c05141969a6b7ae6db97cf2b~mv2.png" "listado-04.png"
d "${B}57766a_29a82774c2084a29a7ce794e19c3eda7~mv2.png" "listado-05.png"
d "${B}57766a_ea96d707074d47b79ea6b92f6321d32a~mv2.png" "listado-06.png"
d "${B}57766a_f2afc72bad9446208b20267d8d5be234~mv2.png" "listado-07.png"
d "${B}57766a_2464aa7c942c45ed983ac84a40bda098~mv2.png" "listado-08.png"
d "${B}57766a_42273a89daf34427a06e1df72ae78550~mv2.png" "listado-09.png"

echo "== Blog (/ffr-blog) =="
d "${B}11062b_2aeb4b962a3549aa9570ca40999e7d1a~mv2_d_4256_2832_s_4_2.jpg" "blog-banner.jpg"
d "${B}57766a_d1c4597fbe984f83bc2500dd3798cea6~mv2.jpg" "blog-post-01.jpg"
d "${B}57766a_ef4ca17fa1b944b5b2dce7e3eeb0be83~mv2.jpg" "blog-post-02.jpg"

echo "Listo. Imagenes internas en ./imagenes/internas/  ($(ls imagenes/internas | wc -l) archivos)"
