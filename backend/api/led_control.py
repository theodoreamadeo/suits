from fastapi import APIRouter, HTTPException
import serial
import time
import random
import platform

router = APIRouter()

# Try to connect to Arduino - adjust port as needed
try:
    # Windows typically uses COM ports
    port = 'COM5'  # Try common Windows port first
    
    # For cross-platform compatibility
    if platform.system() != 'Windows':
        port = '/dev/ttyACM0'  # Linux/macOS port
        
    arduino = serial.Serial(
        port=port,  # This might be different on your system
        baudrate=9600,
        timeout=1
    )
    time.sleep(2)  # Give the connection time to establish
    arduino_connected = True
    print(f"Arduino connected successfully on {port}")
except Exception as e:
    arduino_connected = False
    arduino = None
    print(f"Arduino not connected or port incorrect: {e}")

# Valid nodes and constraints
VALID_NODES = {
    'A': list(range(1, 9)) + list(range(11, 19)),
    'B': list(range(1, 9)) + list(range(11, 19)),
    'C': list(range(1, 9)) + list(range(11, 19)),
    'D': list(range(1, 9)) + list(range(11, 19)),
    'E': list(range(1, 9)) + list(range(11, 19)),
}

VALID_LEVELS = [1, 2, 3]

DIRECTION_CONSTRAINTS = {
    'A': 'L',  # Node A must be L
    'E': 'R',  # Node E must be R
    'B': ['L', 'R'],  # Node B can be either
    'C': ['L', 'R'],  # Node C can be either
    'D': ['L', 'R'],  # Node D can be either
}

def generate_random_command():
    """Generate a random valid command for the Arduino"""
    # Pick 1-3 random nodes
    node_count = 3
    nodes = []
    
    # Add at least one node from A-E to ensure we have variety
    node_types = random.sample(['A', 'B', 'C', 'D', 'E'], min(5, node_count))
    
    for node_type in node_types:
        # Pick a random position for this node type
        position = random.choice(VALID_NODES[node_type])
        nodes.append(f"{node_type}{position}")
    
    # Pick 1-3 random levels
    level_count = 3
    levels = random.sample(VALID_LEVELS, level_count)
    
    # Generate directions based on constraints
    directions = []
    for node in nodes:
        node_type = node[0]  # Extract the letter
        if node_type in DIRECTION_CONSTRAINTS:
            constraint = DIRECTION_CONSTRAINTS[node_type]
            if isinstance(constraint, list):
                direction = random.choice(constraint)
            else:
                direction = constraint
            directions.append(direction)
    
    # Combine into a command string
    command = f"{','.join(nodes)},{','.join(map(str, levels))},{','.join(directions)}"
    return command

@router.post("/led-control/generate")
async def generate_command():
    """Generate and send a single random command"""
    command = generate_random_command()
    
    # Check if Arduino is connected, or try to reconnect
    arduino_available = check_arduino_connection()
    
    if arduino_available:
        try:
            # Clear any pending data first
            arduino.reset_input_buffer()
            
            print(f"Sending command to Arduino: {command}")
            arduino.write((command + '\n').encode())
            
            # Wait for response with timeout
            response = ""
            timeout_start = time.time()
            while time.time() < timeout_start + 3:  # 3 second timeout
                if arduino.in_waiting > 0:
                    response = arduino.readline().decode().strip()
                    print(f"Received from Arduino: {response}")
                    break
                time.sleep(0.1)
            
            if not response:
                print("No response received from Arduino within timeout")
                response = "No response (timeout)"
            
            return {
                "status": "success",
                "command": command,
                "arduino_response": response,
                "connection_status": "connected"
            }
        except Exception as e:
            print(f"Error communicating with Arduino: {e}")
            # If communication fails, set connected flag to False
            global arduino_connected
            arduino_connected = False
            
            # Fall back to simulated mode
            return {
                "status": "warning",
                "command": command,
                "arduino_response": f"Arduino communication error: {str(e)}",
                "connection_status": "error"
            }
    else:
        # Arduino not connected, return the generated command in simulated mode
        return {
            "status": "warning",
            "command": command,
            "arduino_response": "Arduino not connected (simulated mode)",
            "connection_status": "disconnected"
        }

@router.post("/led-control/send")
async def send_command(command: str):
    """Send a specific command to the Arduino"""
    # Check if Arduino is connected, or try to reconnect
    arduino_available = check_arduino_connection()
    
    print(f"Received request to send command: {command}")
    
    if arduino_available:
        try:
            # Clear any pending data first
            arduino.reset_input_buffer()
            
            print(f"Sending command to Arduino: {command}")
            arduino.write((command + '\n').encode())
            
            # Wait for response with timeout
            response = ""
            timeout_start = time.time()
            while time.time() < timeout_start + 3:  # 3 second timeout
                if arduino.in_waiting > 0:
                    response = arduino.readline().decode().strip()
                    print(f"Received from Arduino: {response}")
                    break
                time.sleep(0.1)
            
            if not response:
                print("No response received from Arduino within timeout")
                response = "No response (timeout)"
            
            return {
                "status": "success",
                "command": command,
                "arduino_response": response,
                "connection_status": "connected"
            }
        except Exception as e:
            print(f"Error communicating with Arduino: {e}")
            # If communication fails, set connected flag to False
            global arduino_connected
            arduino_connected = False
            
            # Fall back to simulated mode
            return {
                "status": "warning",
                "command": command,
                "arduino_response": f"Arduino communication error: {str(e)}",
                "connection_status": "error"
            }
    else:
        # Arduino not connected, return the command in simulated mode
        return {
            "status": "warning",
            "command": command,
            "arduino_response": "Arduino not connected (simulated mode)",
            "connection_status": "disconnected"
        }

@router.get("/led-control/status")
async def check_status():
    """Check the Arduino connection status"""
    is_connected = check_arduino_connection()
    
    return {
        "connected": is_connected,
        "port": port if is_connected else None,
        "status": "connected" if is_connected else "disconnected"
    }

def check_arduino_connection():
    """Check if Arduino is still connected or try to reconnect"""
    global arduino, arduino_connected
    
    if arduino_connected and arduino:
        try:
            # Check if connection is still valid
            if arduino.isOpen():
                return True
            else:
                arduino_connected = False
                return False
        except Exception:
            arduino_connected = False
            return False
    
    # Try to reconnect
    try:
        # Windows typically uses COM ports
        port = 'COM5'  # Try common Windows port first
        
        # For cross-platform compatibility
        if platform.system() != 'Windows':
            port = '/dev/ttyACM0'  # Linux/macOS port
            
        arduino = serial.Serial(
            port=port,
            baudrate=9600,
            timeout=1
        )
        time.sleep(1)  # Give the connection time to establish
        arduino_connected = True
        print(f"Arduino reconnected successfully on {port}")
        return True
    except Exception as e:
        arduino_connected = False
        arduino = None
        print(f"Could not reconnect to Arduino: {e}")
        return False