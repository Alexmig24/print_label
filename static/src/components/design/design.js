/** @odoo-module **/

import { Component, useState, useRef, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

import * as selection from "./design_selection";
import * as dragdrop from "./design_dragdrop";
import * as objects from "./design_objects";
import * as properties from "./design_properties";
import * as templates from "./design_templates";
import * as templateCrud from "./design_template_crud";
import * as exportMethods from "./design_export";

fabric.Object.prototype.toObject = (function(toObject) {
    return function(additionalProperties) {
        return toObject.call(this, ['fieldKey', 'objectType', 'barcodeValue', 'barcodeFormat', 'customExpression'].concat(additionalProperties || []));
    };
})(fabric.Object.prototype.toObject);

class Design extends Component {

    setup() {
        this.orm = useService("orm");
        this.notification = useService("notification");
        this.productFields = [];

        this.state = useState({
            ready: false,
            selected: null,
            selectedType: null,
            sampleProduct: null,
            loadingProduct: false,
            text: '',
            fontSize: 16,
            bold: false,
            italic: false,
            textAlign: 'left',
            fill: '#000000',
            fieldKey: null,
            barcodeFormat: 'CODE128',
            customExpression: '',
            stroke: '#000000',
            shapeFill: 'transparent',
            posX: 0,
            posY: 0,
            showGrid: true,
            isDraggingOver: false,
            templates: [],
            currentTemplateId: null,
            currentTemplateName: '',
            showTemplateMenu: false,
            savingTemplate: false,
            fieldSearch: '',
        });

        this.refsCanvas = useRef("canvas");
        this.state.loadingFields = true;

        onMounted(async () => {
            this.initCanvas();
            await this.loadProductFields();
            this.loadTemplates();
        });
    }

    get filteredProductFields() {
        const q = (this.state.fieldSearch || '').toLowerCase().trim();
        if (!q) return this.productFields;
        return this.productFields.filter(f => f.label.toLowerCase().includes(q));
    }

    initCanvas() {
        this.canvas = new fabric.Canvas(this.refsCanvas.el, {
            selection: true,
            backgroundColor: '#ffffff',
        });

        this.canvas.on('selection:created', (e) => this._onSelect(e));
        this.canvas.on('selection:updated', (e) => this._onSelect(e));
        this.canvas.on('selection:cleared', () => this._onClear());
        this.canvas.on('object:modified', () => this._syncPosition());

        this.canvas.renderAll();
        this.state.ready = true;
    }
}

Object.assign(Design.prototype, selection);
Object.assign(Design.prototype, dragdrop);
Object.assign(Design.prototype, objects);
Object.assign(Design.prototype, properties);
Object.assign(Design.prototype, templates);
Object.assign(Design.prototype, templateCrud);
Object.assign(Design.prototype, exportMethods);

Design.template = "print_label.design";
registry.category("actions").add("print_label.design", Design);