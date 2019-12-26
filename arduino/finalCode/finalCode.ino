bool watering_flag , error_flag, dataSentAtStart, wateringRunning;
int waterLevel, timeBeforeError, buttonReadInterval, lightSensorPin, waterLevelPin, tempPin, pumpControl, sensorPowerPin, errorLedPin, wateringButton, resetButton, wateringButtonState , resetButtonState, thermistorNominal, temperatureNominal, bCoefficient, seriesResistor;
float waterLevelSensorVoltage, temperature, lightValue ;
unsigned long currentMillis, previousMillis, readInterval, wateringReadInterval, wateringPreviousMillis, wateringStartTime, lastButtonRead,dataSendInterval,dataSentLast;
String message;
char incoming, EOL;

//// "Constants"
// HOX! Bounds are 0,2,4,6,8,10
int waterLevelLowerBound = 1;
int waterLevelUpperBound = 8;
float waterLevelSteps[] = {0.0, 2.0, 2.01, 2.2, 2.21, 2.55, 2.556, 3.1, 3.11, 4.05, 4.06, 5};
/*
  Sensor level voltages
  1.9V  =   index 0-1   =     level 0
  2.1V  =   index 2-3   =     level 1
  2.3V  =   index 4-5   =     level 2
  2.8V  =   index 6-7   =     level 3
  3.4V  =   index 8-9   =     level 4
  4.7V  =   index 10-11 =     level 5
*/
// Common
int numSamples = 5; // Samples to take when reading sensors
int timeBetweenSensorReads = 30;
int samples[5];

void setup() {
  Serial.begin(115200); //sets serial port for communication

  // Intervals
  buttonReadInterval = 100;
  dataSendInterval = 1800000; // Send data to serial
  dataSentLast = 0;
  readInterval = 60000; // Time between main sensor reads
  wateringReadInterval = 500; // Time between updates when watering
  timeBetweenSensorReads = 30; // Delay while readin multiple results from sensors for average result.


  // Set pins
  lightSensorPin = A0;
  waterLevelPin = A1;
  tempPin = A2;
  resetButton = 2;
  wateringButton = 3;
  pumpControl = 4;
  sensorPowerPin = 5;
  errorLedPin = 6;



  // Digital pins
  pinMode(sensorPowerPin, OUTPUT);
  pinMode(errorLedPin, OUTPUT);
  pinMode(pumpControl, OUTPUT);
  pinMode(resetButton, INPUT_PULLUP);
  pinMode(wateringButton, INPUT_PULLUP);

  // Buttons
  lastButtonRead, wateringButtonState, resetButtonState = 0;

  //// Common
  numSamples = 5; // Samples to take when reading sensors. Remember to set

  //// Temperature
  thermistorNominal = 10000; // resistance at 25 degrees C
  temperatureNominal = 25; // temp. for nominal resistance (almost always 25 C)
  bCoefficient = 3950; // Beta coefficient
  seriesResistor = 10000; // Ohm value of the resistor in series with the termistor

  // Message parsing & sending
  EOL = '!'; // End of line marker so that the serial reciever knows when the message is complete.

  dataSentAtStart = false; // One serial message of sensor reads is sent at the start of the program.

  // Watering
  timeBeforeError = 30000;
  wateringRunning = false;
  wateringStartTime = 0;
  watering_flag = false;
  currentMillis = 0;
  previousMillis = millis();
  wateringPreviousMillis = 0;

  // Sensor variables
  lightValue = 0;
  temperature = 0;
  waterLevelSensorVoltage = 0;
}

void loop() {
  currentMillis = millis();

  //// SERIAL
  // Listen for serial messages and parse them
  if (Serial.available()) {
    incoming = Serial.read();
    if (incoming == EOL) {
      Serial.flush();
      parseMessage(message);
      message = "";
    }
    else {
      message += incoming;
    }
  }

  // Send sensor data to serial
  if (!dataSentAtStart) {
    dataSentLast = millis();
    previousMillis = millis();
    dataSentAtStart = true;
    readSensors();
    printValuesToSerial("AUT");
  }

// DATA SEND LOOP
   if (dataSentLast + dataSendInterval < currentMillis) {
    dataSentLast = millis();
      readSensors();
    printValuesToSerial("AUT");
  }

  //// BUTTON LOOP
  if (lastButtonRead + buttonReadInterval < currentMillis) {
    lastButtonRead = millis();

    wateringButtonState = digitalRead(wateringButton);
    if (wateringButtonState == LOW) {
      Serial.println("Local manual watering requested!");
      watering_flag = true;
    }
    resetButtonState = digitalRead(resetButton);
    if (resetButtonState == LOW) {
      resetError();
    }
  }
  //// BUTTON LOOP END

  // IF no errors continue automation
  if (!error_flag) {

    //// LONG INTERVAL LOOP
    // IF watering is not in action and readInterval is up. DO...
    if (!watering_flag && currentMillis > readInterval + previousMillis)
    {
      previousMillis = millis();
      readSensors();

      // IF water is below "upper" lowerbound value. Try to start watering.
      if (waterLevelSteps[waterLevelLowerBound + 1] > waterLevelSensorVoltage)
      {
        watering_flag = true;
      }
    }

    //// WATERING LOOP
    // Watering loop that updates at smaller intervals
    if (watering_flag && currentMillis > wateringReadInterval + wateringPreviousMillis)
    {
      wateringPreviousMillis = millis();
      readSensors();

      //// ERROR LOGIC
      if (wateringRunning && wateringStartTime + timeBeforeError < currentMillis ) {
        stopWatering();
        error_flag = true;
        digitalWrite(errorLedPin, HIGH);
        Serial.println("Error! Pumptime exceeded! ");
      }

      // IF water level reading is above the "lower upperbound". Stop watering.
      if (waterLevelSteps[waterLevelUpperBound] < waterLevelSensorVoltage)
      {
        stopWatering();
      }

      // IF not already running AND no errors. DO...
      if (watering_flag && !wateringRunning && !error_flag) {
        StartWatering();
      }

    }
  }
}

//// FUNCTIONS
void resetError() {
  error_flag = false;
  digitalWrite(errorLedPin, LOW);
  Serial.println("RESET!");
}

void readSensors() {
  digitalWrite(sensorPowerPin, HIGH);   // Power to sensors
  delay(200);                           // Make shure the sensor is up and steady
  measureWaterLevel();
  readTemp();
  readLight();
  digitalWrite(sensorPowerPin, LOW);
}


void parseMessage(String message) {
  if (message.equalsIgnoreCase("wateringOn")) {
    watering_flag = true;
  }
  else if (message.equalsIgnoreCase("Print Values")) {
    printValuesToSerial("MAN");
  }
  else {
    Serial.println("Unidentified Command!");
  }
}

void printValuesToSerial(String requestType) {
  Serial.print(requestType);
  Serial.print("temp:");
  Serial.print(temperature);
  Serial.print(",light:");
  Serial.print(lightValue);
  Serial.print(",wlevel:");
  Serial.print(findWaterLevel());
  Serial.println(EOL);
}

void StartWatering() {
  wateringStartTime = millis();
  wateringRunning = true;
  digitalWrite(pumpControl, HIGH);
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("Watering Started!");
}

void stopWatering() {
  wateringRunning = false;
  wateringStartTime = 0;
  watering_flag = false;
  digitalWrite(pumpControl, LOW);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("Watering stopped!");
  readSensors();
  printValuesToSerial("AUT");
}

void readLight() {
  float averageReading = 0;
  for (int i = 0; i < numSamples ; i++) {
    averageReading += analogRead(lightSensorPin);
    delay(timeBetweenSensorReads);
  }
  // Calculate avarage. Set range to 0.0 - 10.24 and inverse reading so more light is more value.
  lightValue = 10.24 - ((averageReading / numSamples) / 100);
}

int findWaterLevel()
{
  int level = 0;
  for (int i = 0, j = 0; i <= 8; i += 2, j++)
  {
    if (waterLevelSteps[i] <= waterLevelSensorVoltage && waterLevelSteps[i + 1] >= waterLevelSensorVoltage)
    {
      level = j;
      break;
    }
  }
  return level;
}

void measureWaterLevel()
{
  float averageReading = 0;
  for (int i = 0; i < numSamples ; i++) {
    averageReading += analogRead(waterLevelPin);
    delay(timeBetweenSensorReads);
  }
  waterLevel = averageReading / numSamples;
  waterLevelSensorVoltage = waterLevel * (5.0 / 1023.0);
}

void readTemp() {
  float average;
  // Read multiple samples for more accuracy
  for (int i = 0; i < 5; i++)
  {
    samples[i] = analogRead(tempPin);
    delay(timeBetweenSensorReads);
  }
  // Take avarage from the samples
  average = 0;
  for (int i = 0; i < numSamples; i++)
  {
    average += samples[i];
  }
  average /= numSamples;

  // Convert the value to resistance
  average = 1023 / average - 1;
  average = seriesResistor / average;
  // Calculate the temperature in Celsius using Steinhart-Hart equation
  temperature = average / thermistorNominal;         // (R/Ro)
  temperature = log(temperature);                           // ln(R/Ro)
  temperature /= bCoefficient;                       // 1/B * ln(R/Ro)
  temperature += 1.0 / (temperatureNominal + 273.15);// + (1/To)
  temperature = 1.0 / temperature;                          // Invert
  temperature -= 273.15;                             // convert to C
}
