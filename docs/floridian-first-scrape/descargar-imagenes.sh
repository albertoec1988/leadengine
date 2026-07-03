#!/usr/bin/env bash
# ------------------------------------------------------------------
# Descarga de imagenes originales de floridianfirstrealty.com
# ------------------------------------------------------------------
# Uso:   bash descargar-imagenes.sh
# Resultado: las 29 imagenes se guardan en ./imagenes/ con nombres
#            legibles que coinciden con manifiesto-imagenes.csv
#
# Nota: este script lo ejecutas TU. Descarga las imagenes originales
#       (sin recortes ni compresion de Wix) desde su URL de origen.
# ------------------------------------------------------------------
set -e
cd "$(dirname "$0")"
mkdir -p imagenes
DL="curl -L -s -o"   # si no tienes curl, cambia por: wget -O

descargar () { echo "  -> $2"; $DL "imagenes/$2" "$1"; }

echo "Descargando imagenes de Floridian First Realty..."

descargar "https://static.wixstatic.com/media/57766a_1e79ca0eb88c4511871d5382a339fcee~mv2.png" "00_logo-floridian-white.png"
descargar "https://static.wixstatic.com/media/57766a_064cdd8ee4064f0ca205386299be884ef000.jpg" "01_hero-invested-in-you.jpg"
descargar "https://static.wixstatic.com/media/57766a_d37404d576834d6aa2ac68ff60a0b3a1~mv2.jpg" "02_categoria-residential.jpg"
descargar "https://static.wixstatic.com/media/5e684c_de90859111784406888fb97396b22b9d~mv2.jpg" "03_categoria-commercial.jpg"
descargar "https://static.wixstatic.com/media/57766a_f01ef7d2f8a0421184f069c2865b3d86~mv2.jpg" "04_categoria-luxury.jpg"
descargar "https://static.wixstatic.com/media/57766a_7c86ffa9f7864ae092c6f458ef456edc~mv2.jpg" "05_michelle-y-kevin-gonzalez.jpg"
descargar "https://static.wixstatic.com/media/11062b_f4e3e7f537ff4762a1914aa14e3e36b9~mv2.png" "06_decorativo-1.png"
descargar "https://static.wixstatic.com/media/11062b_7dcffe5daf2944b7be0a46ac6d472634~mv2.png" "07_decorativo-2.png"
descargar "https://static.wixstatic.com/media/11062b_603340b7bcb14e7785c7b65b233cd9f9~mv2.png" "08_decorativo-3.png"
descargar "https://static.wixstatic.com/media/11062b_7edd292d29b34c309100535a26dc5033~mv2.png" "09_decorativo-4.png"
descargar "https://static.wixstatic.com/media/11062b_bb8766c7484e43a8bb67f5ee010f6e09~mv2.jpeg" "10_happy-clients-beach.jpeg"
descargar "https://static.wixstatic.com/media/57766a_92860e3b4ea54cdaa40d523628b114de~mv2.png" "11_cliente-jealous-fork.png"
descargar "https://static.wixstatic.com/media/57766a_5baba89fe87844d29cee79d1dbe9c4da~mv2.png" "12_cliente-mistero1.png"
descargar "https://static.wixstatic.com/media/7cbaca_22f5028e5559440c96cc59f72e46cdb8~mv2.png" "13_cliente-la-boulangerie-boulmich.png"
descargar "https://static.wixstatic.com/media/57766a_12d6f743dc8d4442899480d10b55d86c~mv2.png" "14_cliente-nothing-bundt-cakes.png"
descargar "https://static.wixstatic.com/media/57766a_a58fce858c224689bf26a63541196f02~mv2.png" "15_cliente-sana-skin.png"
descargar "https://static.wixstatic.com/media/57766a_a866f84121bc4076865325afa94ce1e1~mv2.png" "16_cliente-pincrest-bakery.png"
descargar "https://static.wixstatic.com/media/57766a_f240221ba6d4423fb2c900eeada132ab~mv2.jpg" "17_cliente-blaze-pizza.jpg"
descargar "https://static.wixstatic.com/media/57766a_2c29344f1f47491c89d74ce98a41c78d~mv2.png" "18_cliente-white-logo-1.png"
descargar "https://static.wixstatic.com/media/57766a_66f160a008ce4c9196db8a207ffb4797~mv2.png" "19_cliente-poke-house.png"
descargar "https://static.wixstatic.com/media/57766a_91302cea56ea4ad5bf5da100fc4108e5~mv2.png" "20_cliente-oh-my-gosh-brigadeiros.png"
descargar "https://static.wixstatic.com/media/57766a_2078c7f3052e487e8f4118e697948346~mv2.png" "21_cliente-white-logo-2.png"
descargar "https://static.wixstatic.com/media/57766a_e23c64e615cf4ea29a4e356fd470b380~mv2.png" "22_cliente-chicken-kitchen.png"
descargar "https://static.wixstatic.com/media/57766a_f8463245f355409e86ce22982f738998~mv2.png" "23_assoc-womens-council-realtors.png"
descargar "https://static.wixstatic.com/media/57766a_82595d6b9f7e49f39ad89649b09d334d~mv2.png" "24_assoc-equal-housing-opportunity.png"
descargar "https://static.wixstatic.com/media/57766a_57acd50ea4b84d529ea99d631effb83c~mv2.png" "25_assoc-national-association-realtors.png"
descargar "https://static.wixstatic.com/media/57766a_e4b24b8a314c456cb4af4098a716fa86~mv2.png" "26_assoc-fiu-business.png"
descargar "https://static.wixstatic.com/media/57766a_148f538a77fb431399f81d633a01d443~mv2.png" "27_assoc-coral-gables-chamber.png"
descargar "https://static.wixstatic.com/media/57766a_f44fc74b2f814a37a0757c357cc62c58~mv2.png" "28_assoc-florida-ccim-chapter.png"

echo "Listo. Imagenes en ./imagenes/  ($(ls imagenes | wc -l) archivos)"
