#include <SoftwareSerial.h>

// Define Rx and Tx pins for communication with the main Arduino
#define RX_PIN 15  // Connect to TX of main Arduino
#define TX_PIN 14  // Connect to RX of main Arduino

// Create SoftwareSerial instance
SoftwareSerial mainArduinoComm(RX_PIN, TX_PIN);

// Constants
#define NUM_SHELVES 16
#define NUM_LEVELS 3

// Define the pin array for shelf LEDs - 16 shelves with 3 levels each
const int shelfLedPins[NUM_SHELVES][NUM_LEVELS] = {
  {10, 9, 8}, // Shelf 1 (bottom, middle, top)
  {7, 6, 5}, // Shelf 2
  {13, 12, 11}, // Shelf 3
  {2, 4, 3}, // Shelf 4
  {A4, A5, A6}, // Shelf 5
  {49, 50, 51}, // Shelf 6
  {A1, A2, A3}, // Shelf 7
  {46, 47, 48}, // Shelf 8
  {43, 44, 45}, // Shelf 9
  {37, 38, 39}, // Shelf 10
  {42, 41, 40}, // Shelf 11
  {36, 35, 34}, // Shelf 12
  {24, 23, 22}, // Shelf 13
  {28, 29, 30}, // Shelf 14
  {25, 26, 27}, // Shelf 15
  {31, 32, 33}  // Shelf 16
};

// Function to turn on a specific shelf LED
void setShelfLed(int shelfIndex, int level, bool state) {
  if (shelfIndex >= 0 && shelfIndex < NUM_SHELVES && level >= 0 && level < NUM_LEVELS) {
    digitalWrite(shelfLedPins[shelfIndex][level], state ? HIGH : LOW);
  }
}

// Function to clear all shelf LEDs
void clearAllShelfLeds() {
  for (int shelf = 0; shelf < NUM_SHELVES; shelf++) {
    for (int level = 0; level < NUM_LEVELS; level++) {
      setShelfLed(shelf, level, false);
    }
  }
}

// Function to determine shelf index from node and side (L/R)
int getShelfIndex(char letter, int number, char side) {
  // Handle special cases for A and E
  if (letter == 'A') {
    // A is always Left side regardless of what's specified
    if (number >= 1 && number <= 8) return 0; // Shelf 1
    if (number >= 11 && number <= 18) return 1; // Shelf 2
  } 
  else if (letter == 'B') {
    if (side == 'R') {
      if (number >= 1 && number <= 8) return 2; // Shelf 3
      if (number >= 11 && number <= 18) return 3; // Shelf 4
    } else { // side is 'L'
      if (number >= 1 && number <= 8) return 4; // Shelf 5
      if (number >= 11 && number <= 18) return 5; // Shelf 6
    }
  }
  else if (letter == 'C') {
    if (side == 'R') {
      if (number >= 1 && number <= 8) return 6; // Shelf 7
      if (number >= 11 && number <= 18) return 7; // Shelf 8
    } else { // side is 'L'
      if (number >= 1 && number <= 8) return 8; // Shelf 9
      if (number >= 11 && number <= 18) return 9; // Shelf 10
    }
  }
  else if (letter == 'D') {
    if (side == 'R') {
      if (number >= 1 && number <= 8) return 10; // Shelf 11
      if (number >= 11 && number <= 18) return 11; // Shelf 12
    } else { // side is 'L'
      if (number >= 1 && number <= 8) return 12; // Shelf 13
      if (number >= 11 && number <= 18) return 13; // Shelf 14
    }
  }
  else if (letter == 'E') {
    // E is always Right side regardless of what's specified
    if (number >= 1 && number <= 8) return 14; // Shelf 15
    if (number >= 11 && number <= 18) return 15; // Shelf 16
  }
  
  return -1; // Invalid shelf
}

// Function to generate a random valid command
String generateRandomCommand() {
  // Valid node letters
  char nodeLetters[5] = {'A', 'B', 'C', 'D', 'E'};
  
  // Decide on number of nodes (1-3)
  int numNodes = random(1, 4); // 1, 2, or 3
  
  String command = "";
  
  // Generate nodes
  for (int i = 0; i < numNodes; i++) {
    // Pick a random node letter
    char nodeLetter = nodeLetters[random(0, 5)];
    
    // Determine valid range (1-8 or 11-18)
    int rangeStart = random(0, 2) == 0 ? 1 : 11;
    int rangeEnd = rangeStart + 7;
    
    // Generate random position within the selected range
    int nodePos = random(rangeStart, rangeEnd + 1);
    
    // Add node to command
    if (i > 0) command += ",";
    command += nodeLetter + String(nodePos);
  }
  
  // Add levels (1-3)
  for (int i = 0; i < numNodes; i++) {
    int level = random(1, 4); // 1, 2, or 3
    command += "," + String(level);
  }
  
  // Add directions based on node constraints
  for (int i = 0; i < numNodes; i++) {
    char nodeLetter = command.charAt(i * 2); // Get the node letter from the command
    
    if (nodeLetter == 'A') {
      command += ",L"; // A must be L
    } else if (nodeLetter == 'E') {
      command += ",R"; // E must be R
    } else {
      // B, C, D can be either L or R
      command += random(0, 2) == 0 ? ",L" : ",R";
    }
  }
  
  return command;
}

void handleSinglePosition(String input) {
  // Expecting format like "B12,1,L"
  int commaCount = 0;
  for (int i = 0; i < input.length(); i++) {
    if (input.charAt(i) == ',') commaCount++;
  }
  
  if (commaCount == 2) { // Need exactly 2 commas for 3 values
    int firstComma = input.indexOf(',');
    int secondComma = input.indexOf(',', firstComma + 1);
    
    // Extract the three parts
    String nodeStr = input.substring(0, firstComma);
    String levelStr = input.substring(firstComma + 1, secondComma);
    String sideStr = input.substring(secondComma + 1);
    
    // Parse node
    char nodeLetter = nodeStr.charAt(0);
    int nodeNumber = nodeStr.substring(1).toInt();
    
    // Parse level (1=bottom, 2=middle, 3=top, but array is 0-indexed)
    int level = levelStr.toInt() - 1; // Convert to 0-indexed
    
    // Parse side
    char side = sideStr.charAt(0);
    
    // Validate node letter and side constraints
    if (nodeLetter == 'A' && side != 'L') {
      Serial.println("ERROR: Node A must use direction L");
      return;
    }
    if (nodeLetter == 'E' && side != 'R') {
      Serial.println("ERROR: Node E must use direction R");
      return;
    }
    
    // Send the pathfinding info to the main Arduino
    mainArduinoComm.println(nodeStr);
    
    Serial.print("Sent to main Arduino: ");
    Serial.println(nodeStr);
    
    // Control shelf LEDs
    clearAllShelfLeds();
    
    // Only try to light shelf LEDs for nodes A-E
    if (nodeLetter >= 'A' && nodeLetter <= 'E') {
      int shelfIndex = getShelfIndex(nodeLetter, nodeNumber, side);
      
      if (shelfIndex >= 0 && level >= 0 && level < NUM_LEVELS) {
        setShelfLed(shelfIndex, level, true);
        Serial.print("Turned ON shelf ");
        Serial.print(shelfIndex + 1);
        Serial.print(" at level ");
        Serial.println(level + 1);
      } else {
        Serial.println("Invalid shelf mapping for node or level");
      }
    } else {
      Serial.println("Node is not valid for shelf control (only A-E are valid)");
    }
    
    // Check for response from main Arduino
    checkMainArduinoResponse();
    
    // Return OK to frontend
    Serial.println("OK");
  } else {
    Serial.println("ERROR: Invalid format. Use NODE,LEVEL,SIDE (e.g., B12,1,L)");
  }
}

void handleDualPositions(String input) {
  // Expecting format like "B12,D6,1,2,L,R"
  int commaCount = 0;
  for (int i = 0; i < input.length(); i++) {
    if (input.charAt(i) == ',') commaCount++;
  }
  
  if (commaCount == 5) { // We need exactly 5 commas for 6 values
    int firstComma = input.indexOf(',');
    int secondComma = input.indexOf(',', firstComma + 1);
    int thirdComma = input.indexOf(',', secondComma + 1);
    int fourthComma = input.indexOf(',', thirdComma + 1);
    int fifthComma = input.indexOf(',', fourthComma + 1);
    
    // Extract the six parts
    String node1Str = input.substring(0, firstComma);
    String node2Str = input.substring(firstComma + 1, secondComma);
    String level1Str = input.substring(secondComma + 1, thirdComma);
    String level2Str = input.substring(thirdComma + 1, fourthComma);
    String side1Str = input.substring(fourthComma + 1, fifthComma);
    String side2Str = input.substring(fifthComma + 1);
    
    // Parse nodes
    char node1Letter = node1Str.charAt(0);
    int node1Number = node1Str.substring(1).toInt();
    
    char node2Letter = node2Str.charAt(0);
    int node2Number = node2Str.substring(1).toInt();
    
    // Parse levels (1=bottom, 2=middle, 3=top, but array is 0-indexed)
    int level1 = level1Str.toInt() - 1; // Convert to 0-indexed
    int level2 = level2Str.toInt() - 1; // Convert to 0-indexed
    
    // Parse sides
    char side1 = side1Str.charAt(0);
    char side2 = side2Str.charAt(0);
    
    // Validate node letter and side constraints
    if (node1Letter == 'A' && side1 != 'L') {
      Serial.println("ERROR: Node A must use direction L");
      return;
    }
    if (node1Letter == 'E' && side1 != 'R') {
      Serial.println("ERROR: Node E must use direction R");
      return;
    }
    if (node2Letter == 'A' && side2 != 'L') {
      Serial.println("ERROR: Node A must use direction L");
      return;
    }
    if (node2Letter == 'E' && side2 != 'R') {
      Serial.println("ERROR: Node E must use direction R");
      return;
    }
    
    // Always send the pathfinding info to the main Arduino, regardless of node letters
    String pathMessage = node1Str + "," + node2Str;
    mainArduinoComm.println(pathMessage);
    
    Serial.print("Sent to main Arduino: ");
    Serial.println(pathMessage);
    
    // Control shelf LEDs - only if nodes are A-E (valid for shelf control)
    clearAllShelfLeds();
    
    // Only try to light shelf LEDs for nodes A-E
    if (node1Letter >= 'A' && node1Letter <= 'E') {
      int shelf1Index = getShelfIndex(node1Letter, node1Number, side1);
      
      if (shelf1Index >= 0 && level1 >= 0 && level1 < NUM_LEVELS) {
        setShelfLed(shelf1Index, level1, true);
        Serial.print("Turned ON shelf ");
        Serial.print(shelf1Index + 1);
        Serial.print(" at level ");
        Serial.println(level1 + 1);
      } else {
        Serial.println("Invalid shelf mapping for node 1 or level 1");
      }
    } else {
      Serial.println("Node 1 is not valid for shelf control (only A-E are valid)");
    }
    
    if (node2Letter >= 'A' && node2Letter <= 'E') {
      int shelf2Index = getShelfIndex(node2Letter, node2Number, side2);
      
      if (shelf2Index >= 0 && level2 >= 0 && level2 < NUM_LEVELS) {
        setShelfLed(shelf2Index, level2, true);
        Serial.print("Turned ON shelf ");
        Serial.print(shelf2Index + 1);
        Serial.print(" at level ");
        Serial.println(level2 + 1);
      } else {
        Serial.println("Invalid shelf mapping for node 2 or level 2");
      }
    } else {
      Serial.println("Node 2 is not valid for shelf control (only A-E are valid)");
    }
    
    // Check for response from main Arduino
    checkMainArduinoResponse();
    
    // Return OK to frontend
    Serial.println("OK");
  } else {
    Serial.println("ERROR: Invalid format. Use NODE1,NODE2,LEVEL1,LEVEL2,SIDE1,SIDE2 (e.g., B12,D6,1,2,L,R)");
  }
}

void handleTriplePositions(String input) {
  // Expecting format like "B12,D6,C4,1,2,3,L,R,L"
  int commaCount = 0;
  for (int i = 0; i < input.length(); i++) {
    if (input.charAt(i) == ',') commaCount++;
  }
  
  if (commaCount == 8) { // We need exactly 8 commas for 9 values
    int firstComma = input.indexOf(',');
    int secondComma = input.indexOf(',', firstComma + 1);
    int thirdComma = input.indexOf(',', secondComma + 1);
    int fourthComma = input.indexOf(',', thirdComma + 1);
    int fifthComma = input.indexOf(',', fourthComma + 1);
    int sixthComma = input.indexOf(',', fifthComma + 1);
    int seventhComma = input.indexOf(',', sixthComma + 1);
    int eighthComma = input.indexOf(',', seventhComma + 1);
    
    // Extract the nine parts
    String node1Str = input.substring(0, firstComma);
    String node2Str = input.substring(firstComma + 1, secondComma);
    String node3Str = input.substring(secondComma + 1, thirdComma);
    String level1Str = input.substring(thirdComma + 1, fourthComma);
    String level2Str = input.substring(fourthComma + 1, fifthComma);
    String level3Str = input.substring(fifthComma + 1, sixthComma);
    String side1Str = input.substring(sixthComma + 1, seventhComma);
    String side2Str = input.substring(seventhComma + 1, eighthComma);
    String side3Str = input.substring(eighthComma + 1);
    
    // Parse nodes
    char node1Letter = node1Str.charAt(0);
    int node1Number = node1Str.substring(1).toInt();
    
    char node2Letter = node2Str.charAt(0);
    int node2Number = node2Str.substring(1).toInt();
    
    char node3Letter = node3Str.charAt(0);
    int node3Number = node3Str.substring(1).toInt();
    
    // Parse levels (1=bottom, 2=middle, 3=top, but array is 0-indexed)
    int level1 = level1Str.toInt() - 1; // Convert to 0-indexed
    int level2 = level2Str.toInt() - 1; // Convert to 0-indexed
    int level3 = level3Str.toInt() - 1; // Convert to 0-indexed
    
    // Parse sides
    char side1 = side1Str.charAt(0);
    char side2 = side2Str.charAt(0);
    char side3 = side3Str.charAt(0);
    
    // Validate node letter and side constraints
    if (node1Letter == 'A' && side1 != 'L') {
      Serial.println("ERROR: Node A must use direction L");
      return;
    }
    if (node1Letter == 'E' && side1 != 'R') {
      Serial.println("ERROR: Node E must use direction R");
      return;
    }
    if (node2Letter == 'A' && side2 != 'L') {
      Serial.println("ERROR: Node A must use direction L");
      return;
    }
    if (node2Letter == 'E' && side2 != 'R') {
      Serial.println("ERROR: Node E must use direction R");
      return;
    }
    if (node3Letter == 'A' && side3 != 'L') {
      Serial.println("ERROR: Node A must use direction L");
      return;
    }
    if (node3Letter == 'E' && side3 != 'R') {
      Serial.println("ERROR: Node E must use direction R");
      return;
    }
    
    // Always send the pathfinding info to the main Arduino, regardless of node letters
    String pathMessage = node1Str + "," + node2Str + "," + node3Str;
    mainArduinoComm.println(pathMessage);
    
    Serial.print("Sent to main Arduino: ");
    Serial.println(pathMessage);
    
    // Control shelf LEDs - only if nodes are A-E (valid for shelf control)
    clearAllShelfLeds();
    
    // Only try to light shelf LEDs for nodes A-E
    if (node1Letter >= 'A' && node1Letter <= 'E') {
      int shelf1Index = getShelfIndex(node1Letter, node1Number, side1);
      
      if (shelf1Index >= 0 && level1 >= 0 && level1 < NUM_LEVELS) {
        setShelfLed(shelf1Index, level1, true);
        Serial.print("Turned ON shelf ");
        Serial.print(shelf1Index + 1);
        Serial.print(" at level ");
        Serial.println(level1 + 1);
      } else {
        Serial.println("Invalid shelf mapping for node 1 or level 1");
      }
    } else {
      Serial.println("Node 1 is not valid for shelf control (only A-E are valid)");
    }
    
    if (node2Letter >= 'A' && node2Letter <= 'E') {
      int shelf2Index = getShelfIndex(node2Letter, node2Number, side2);
      
      if (shelf2Index >= 0 && level2 >= 0 && level2 < NUM_LEVELS) {
        setShelfLed(shelf2Index, level2, true);
        Serial.print("Turned ON shelf ");
        Serial.print(shelf2Index + 1);
        Serial.print(" at level ");
        Serial.println(level2 + 1);
      } else {
        Serial.println("Invalid shelf mapping for node 2 or level 2");
      }
    } else {
      Serial.println("Node 2 is not valid for shelf control (only A-E are valid)");
    }
    
    if (node3Letter >= 'A' && node3Letter <= 'E') {
      int shelf3Index = getShelfIndex(node3Letter, node3Number, side3);
      
      if (shelf3Index >= 0 && level3 >= 0 && level3 < NUM_LEVELS) {
        setShelfLed(shelf3Index, level3, true);
        Serial.print("Turned ON shelf ");
        Serial.print(shelf3Index + 1);
        Serial.print(" at level ");
        Serial.println(level3 + 1);
      } else {
        Serial.println("Invalid shelf mapping for node 3 or level 3");
      }
    } else {
      Serial.println("Node 3 is not valid for shelf control (only A-E are valid)");
    }
    
    // Check for response from main Arduino
    checkMainArduinoResponse();
    
    // Return OK to frontend
    Serial.println("OK");
  } else {
    Serial.println("ERROR: Invalid format. Use NODE1,NODE2,NODE3,LEVEL1,LEVEL2,LEVEL3,SIDE1,SIDE2,SIDE3 (e.g., B12,D6,C4,1,2,3,L,R,L)");
  }
}

void checkMainArduinoResponse() {
  // Check for response from main Arduino
  unsigned long startTime = millis();
  while (millis() - startTime < 2000) { // Wait up to 2 seconds for response
    if (mainArduinoComm.available() > 0) {
      String response = mainArduinoComm.readStringUntil('\n');
      Serial.print("Response from main Arduino: ");
      Serial.println(response);
      break;
    }
    delay(10);
  }
}

// Function to detect and handle input based on comma count
void processInput(String input) {
  // Count commas to determine the mode
  int commaCount = 0;
  for (int i = 0; i < input.length(); i++) {
    if (input.charAt(i) == ',') commaCount++;
  }
  
  Serial.print("Received input with ");
  Serial.print(commaCount + 1);
  Serial.println(" parameters");

  // Special command for random generation
  if (input == "RANDOM") {
    String randomCmd = generateRandomCommand();
    Serial.print("Generated random command: ");
    Serial.println(randomCmd);
    processInput(randomCmd);
    return;
  }
  
  // Determine mode based on comma count
  if (commaCount == 2) {
    // Single position mode (NODE,LEVEL,SIDE)
    Serial.println("Detected Single Position format");
    handleSinglePosition(input);
  } 
  else if (commaCount == 5) {
    // Dual positions mode (NODE1,NODE2,LEVEL1,LEVEL2,SIDE1,SIDE2)
    Serial.println("Detected Dual Position format");
    handleDualPositions(input);
  } 
  else if (commaCount == 8) {
    // Triple positions mode (NODE1,NODE2,NODE3,LEVEL1,LEVEL2,LEVEL3,SIDE1,SIDE2,SIDE3)
    Serial.println("Detected Triple Position format");
    handleTriplePositions(input);
  } 
  else {
    Serial.println("ERROR: Invalid input format. Could not determine command structure.");
    Serial.println("Valid formats are:");
    Serial.println("- Single position: NODE,LEVEL,SIDE (e.g., B12,1,L)");
    Serial.println("- Dual positions: NODE1,NODE2,LEVEL1,LEVEL2,SIDE1,SIDE2 (e.g., B12,D6,1,2,L,R)");
    Serial.println("- Triple positions: NODE1,NODE2,NODE3,LEVEL1,LEVEL2,LEVEL3,SIDE1,SIDE2,SIDE3 (e.g., B12,D6,C4,1,2,3,L,R,L)");
    Serial.println("- RANDOM: Generate a random valid command");
  }
}

void setup() {
  // Initialize serial communications
  Serial.begin(9600);        // For receiving user input via Serial Monitor
  mainArduinoComm.begin(9600);  // For communicating with main Arduino
  
  // Initialize random seed
  randomSeed(analogRead(0));
  
  // Initialize all shelf LED pins as outputs
  for (int shelf = 0; shelf < NUM_SHELVES; shelf++) {
    for (int level = 0; level < NUM_LEVELS; level++) {
      pinMode(shelfLedPins[shelf][level], OUTPUT);
      digitalWrite(shelfLedPins[shelf][level], LOW); // Start with all LEDs off
    }
  }
  
  Serial.println("Arduino LED Controller Ready");
  Serial.println("Waiting for commands from Python backend...");
  
  // Flash all LEDs briefly to indicate startup
  for (int i = 0; i < 3; i++) {
    // Turn all LEDs on
    for (int shelf = 0; shelf < NUM_SHELVES; shelf++) {
      for (int level = 0; level < NUM_LEVELS; level++) {
        setShelfLed(shelf, level, true);
      }
    }
    delay(200);
    
    // Turn all LEDs off
    clearAllShelfLeds();
    delay(200);
  }
}

void loop() {
  // Check if there's data from the Python backend
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    
    Serial.print("Received from Python: ");
    Serial.println(input);
    
    // Process the input
    processInput(input);
  }
  
  // Check for any unsolicited messages from the main Arduino
  if (mainArduinoComm.available() > 0) {
    String incoming = mainArduinoComm.readStringUntil('\n');
    Serial.print("Message from main Arduino: ");
    Serial.println(incoming);
  }
}