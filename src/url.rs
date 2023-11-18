use std::collections::HashMap;

use tera::{from_value, Function, Result, Value};

pub fn build_href_for(resource_keys: Vec<String>) -> impl Function {
    Box::new(move |args: &HashMap<String, Value>| -> Result<Value> {
        match args.get("filename") {
            Some(val) => match from_value::<String>(val.clone()) {
                Ok(v) => {
                    let req_parts = v.split(".").collect::<Vec<_>>();
                    let closest_match = resource_keys
                        .iter()
                        .find(|p| req_parts.iter().all(|rp| p.contains(rp)));
                    match closest_match {
                        Some(s) => {
                            println!("Coercing {v} to {s}");
                            Ok(s.clone().into())
                        },
                        None => Err("Oup".into()),
                    }
                }
                Err(_e) => Err("Oups".into()),
            },
            None => Err("oups".into()),
        }
    })
}
