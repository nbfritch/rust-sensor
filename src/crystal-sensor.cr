require "kemal"

require "./container"
require "./db"

port = ENV["WEB_PORT"].to_i

db = Container.resolve(Database)

title = "Temps"

get "/" do
  current_readings = db.current_readings()
  render "src/templates/current.ecr", "src/templates/layout.ecr"
end

get "/graph" do
  render "src/templates/graph.ecr", "src/templates/layout.ecr"
end

get "/api/graph" do |env|
  env.response.content_type = "application/json"
  timespan = env.params.query["last"]
  graph_data = db.graph_data(timespan)
  graph_data.to_json
end

put "/api/readings" do |env|
  sensor_name = env.params.json["sensorName"].as(String)
  temperature = env.params.json["temperature"].as(Float64)

  begin
    created_id = db.create_reading(sensor_name, temperature)
    {"message" => "success", "id" => created_id}.to_json
  rescue e1
    {"message" => "error", "details" => e1.to_s }.to_json
  end
end

Kemal.run(port)
