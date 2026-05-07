{
    'name': 'Imprimir Etiquetas',
    'version': '19.0.0.0',
    'category': 'Products',
    'description': '''
        Permite el diseño de la plantilla y la impresion de las etiquetas relacionadas a los productos.
    ''',
    'author': 'Grupo 6 - Arquitectura de Software',
    'license': 'AGPL-3',
    'depends': ['web', 'product', 'stock'],
    'data': [
        'security/security.xml',
        'security/ir.model.access.csv',
        'data/default_template.xml',
        'views/actions.xml',
        'views/menu.xml',
        'views/res_config_setting.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.5.2/qrcode.min.js',
            'print_label/static/src/library/fabric.js',
            'print_label/static/src/library/JsBarcode.all.min.js',
            'print_label/static/src/components/**/*',
            'print_label/static/src/styles/style.css',
        ],
    },
    'installable': True,
    'application': True,
}