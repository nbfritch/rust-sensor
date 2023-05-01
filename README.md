# Crystal Sensor

Web application to view data from my home temperature sensors

## Requirements

crystal >= 1.8
direnv
editorconfig
postgres >= 14

## Setup
Run `./getBulma.sh`
Populate `.envrc`
Run `shards build`

## Release
`shards build --release --no-debug -Dpreview_mt`
`mkdir release`
`cp -r public release/`
`cp bin/crystal-sensor release/`
`cp crystal-sensor.service release/`

Then on the target machine
`# cp crystal-sensor.service /etc/systemd/system/`
`# systemctl daemon-reload`
`# systemctl enable crystal-sensor.service`
`# systemctl start crystal-sensor.service`
`# systemctl status crystal-sensor.service`
`# firewall-cmd --zone=FedoraServer --add-port=5000/tcp --permanent`
