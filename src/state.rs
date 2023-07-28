use actix_web::{
    http::{header::ContentType, StatusCode},
    HttpResponse,
};

pub type AppState = std::sync::Arc<AppStateStruct>;

pub struct AppStateStruct {
    templates: tera::Tera,
}

impl AppStateStruct {
    pub fn new(template: tera::Tera) -> Self {
        Self {
            templates: template,
        }
    }

    pub fn render_template(
        &self,
        template: &str,
        context: &mut tera::Context,
    ) -> Result<HttpResponse, crate::errors::EventError> {
        let current_template = template.replace(".j2", "");
        if !context.contains_key("current_template") {
            context.insert("current_template", &current_template);
        }

        let body = self.templates.render(template, context)?;
        Ok(HttpResponse::build(StatusCode::OK)
            .content_type(ContentType::html())
            .body(body))
    }
}
