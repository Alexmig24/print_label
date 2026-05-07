/** @odoo-module **/

export async function loadTemplate() {
    try {
        const config = await this.orm.call('ome.print.label', 'get_config_data', []);
        this.state.templateId = config.template_id;
    } catch (e) {
        console.error('loadTemplate error', e);
    }
}