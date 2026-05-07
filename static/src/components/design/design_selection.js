/** @odoo-module **/

export function _onSelect(e) {
    const obj = e.selected[0];
    this.state.selected = obj;
    this.state.selectedType = obj.type;
    this.state.posX = Math.round(obj.left || 0);
    this.state.posY = Math.round(obj.top || 0);
    this.state.fieldKey = obj.fieldKey || null;
    this.state.barcodeFormat = obj.barcodeFormat || 'CODE128';
    this.state.customExpression = obj.customExpression || '';

    if (obj.type === 'i-text') {
        this.state.text      = obj.text || '';
        this.state.fontSize  = obj.fontSize || 16;
        this.state.bold      = obj.fontWeight === 'bold';
        this.state.italic    = obj.fontStyle === 'italic';
        this.state.textAlign = obj.textAlign || 'left';
        this.state.fill      = obj.fill || '#000000';
    }

    if (obj.type === 'rect') {
        this.state.stroke    = obj.stroke || '#000000';
        this.state.shapeFill = obj.fill || 'transparent';
    }
}

export function _onClear() {
    this.state.selected     = null;
    this.state.selectedType = null;
    this.state.fieldKey     = null;
    this.state.customExpression = '';
}

export function _syncPosition() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
        this.state.posX = Math.round(obj.left || 0);
        this.state.posY = Math.round(obj.top || 0);
    }
}

export async function loadProductFields() {
    try {
        const fields = await this.orm.call('ome.print.label', 'get_product_fields', []);
        this.productFields = fields;
    } catch (e) {
        console.error('loadProductFields error', e);
        this.notification.add('Error al cargar campos del producto', { type: 'danger' });
    } finally {
        this.state.loadingFields = false;
    }
}

export async function loadSampleProduct() {
    this.state.loadingProduct = true;
    try {
        const fieldKeys = this.productFields.map(f => f.key);
        const products = await this.orm.searchRead(
            'product.template',
            [['active', '=', true],
            ['id','=',14054]],
            fieldKeys,
            { limit: 1, order: 'id asc' }
        );
        if (products.length) {
            const product = products[0];
            this.productFields.forEach((p) => {
                const val = product[p.key];
                p.placeholder = Array.isArray(val) ? val[1] : (val ?? '');
            });
            this.state.sampleProduct = product;
        }
    } catch (e) {
        console.error('loadSampleProduct error', e);
    } finally {
        this.state.loadingProduct = false;
    }
}

export function previewWithSample() {
    const sample = this.state.sampleProduct;
    if (!sample) return;

    this.canvas.getObjects().forEach(obj => {
        if (obj.customExpression && obj.type === 'i-text') {
            const resolved = obj.customExpression.replace(/\$\{(\w+)\}/g, (match, key) => {
                return key in sample ? sample[key] : match;
            });
            obj.set('text', resolved);
            return;
        }
        if (!obj.fieldKey) return;
        const value = sample[obj.fieldKey];
        if (value !== undefined) {
            obj.set('text', String(value));
        }
    });
    this.canvas.renderAll();
}

export function resetPlaceholders() {
    this.canvas.getObjects().forEach(obj => {
        if (obj.customExpression && obj.type === 'i-text') {
            obj.set('text', obj.customExpression);
            return;
        }
        if (!obj.fieldKey) return;
        const field = this.productFields.find(f => f.key === obj.fieldKey);
        if (field && obj.type === 'i-text') {
            obj.set('text', field.placeholder);
        }
    });
    this.canvas.renderAll();
}
