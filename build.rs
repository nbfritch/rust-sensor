use static_files::{resource_dir, NpmBuild};

fn main() -> std::io::Result<()> {
    let is_container_build =
        std::env::var("IS_CONTAINER_BUILD").unwrap_or("false".into()) == "true";
    if is_container_build {
        resource_dir("ui/dist").build()
    } else {
        NpmBuild::new("ui")
        .executable("bun")
        .install()?
        .run("build")?
        .target("ui/dist")
        .change_detection()
        .to_resource_dir()
        .build()
    }
}
