use static_files::NpmBuild;

fn main() -> std::io::Result<()> {
    NpmBuild::new("ui")
        .executable("bun")
        .install()?
        .run("build")?
        .target("ui/dist")
        .change_detection()
        .to_resource_dir()
        .build()
}
