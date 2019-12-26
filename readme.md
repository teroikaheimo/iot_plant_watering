<h1> IOT Project 2019 Automatic plant watering with data collection, visualization and remote control. </h1>
The project is at working prototype stage and should be treated as such!

## Features
### Arduino
- Can be used as standalone automatic watering system.
- Protection for errors like "no sensors attached" and "no water".
- Reset button.
- Manual watering button.
### Raspberry
- Database
- Server for website and API
- API Serial communication with arduino over USB.
### Interface
- Remote control Arduino over network.
- Data visualization.
- Read and show current device status (temp, water, light)
- Actions log.

## Team and responsibilities
### Tero Ikäheimo
##### Arduino
- Serial and sensor code.
##### Raspberry Pi
- Interface
- ExpressJS server/api with Serial communication.
##### Prototype
- Final prototype circuit
- DIY water level sensor.
### Juhani Juusola
##### Arduino
- Code
##### Prototype
- Breadboard test circuit

<p align="center">
  <h2>Overview</h2>
  <img src="additional info/overview.png"/>
  HOX! The moisture sensor was not used in the latest version!
    <br>
  <h2>Prototype Circuit</h2>
  <img src="additional info/wholeCircuit.PNG"/>
  <br>
  <h2>Super Simple Interface Prototype</h2>
  Data visualization using ChartJS, Buttons for data fetching/control and actions log to show user the status of queries (messages disappear in 10s)
  <img src="additional info/interface.PNG" />
  <br>
  <h2>Working prototype</h2>
  The prototype i use to water my money tree. I used Arduino Nano clone and TIP120 Darlington transistor to control the Chinese miniature water pump for automatic watering. The 3 litre watering tank will supply this plant with water for months.
  <img src="additional info/prototypeSmall.jpg"/>
</p>

## Server / API
### Start the program with CLI from the project root. Use:
npm start

### Installation
Needed:
- MySQL/MariaDB Database installed on you testing machine.
- NodeJS installed to you machine (tested with 12.13.1 LTS)
- Postman installed
- (OPTIONAL) Arduino with provided test code. Not needed but you can only read data from database.

1. Use the database creation script(createAndAdd) in 'database' folder.
2. Make test user for database 'iot':
  Username: api
  Password: !#apiPASS
3. Give just basic read write permissions to the user.(SELECT, INSERT, UPDATE)
4. Make sure config.json AND LineChat.js -> url.base settings are configured to your environment!
5. go to the root folder you cloned the repo to.
6. run 'npm install'
7. run 'npm start'
8. open Postman and import the collection from 'postman' folder

Finished! Start making requests...

#### Tips for Raspberry
 - To SSH to raspberry while in local area network use: 'ssh <username>@<ipv6 local address>' or traditional IP. Advantage 
 with IPv6 local address is that is remains the same, so you always know the address to the machine.
  - In a browser. IPv6 address you are navigating to, needs to have square brackets around it example: '[fe80::327f:e902:348d:2ce2]:<port>' 
