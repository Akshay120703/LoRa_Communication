# LoRa Mesh Explorer

A conceptual LoRa-style long-range, low-power mesh communication simulator built with pure HTML, CSS, and JavaScript. This educational tool visualizes mesh network concepts like range, noise, packet loss, and multi-hop relaying in an interactive, browser-based environment.

Deployed Project link:- https://lora-communication.onrender.com/

## 🚀 Features

### **Mesh Architecture Visualization**
- Interactive network canvas showing nodes and connections
- Real-time packet transmission visualization
- Dynamic link quality indicators (strong/weak/failed)
- Configurable network topology (mesh vs star)

### **IoT Dashboard**
- Simulated sensor data streaming
- Real-time charts for sensor values, packet loss, and latency
- Configurable transmission parameters
- Multiple sensor management

### **Network Simulator**
- Advanced network configuration options
- Performance metrics and statistics
- Interactive controls for network behavior
- Visual feedback for network operations

## 📁 Project Structure

```
LoRa_Communication/
├── index.html              # Main mesh architecture page
├── dashboard.html          # IoT dashboard with sensor visualization
├── simulator.html          # Network simulator interface
├── styles.css              # Unified styling for all pages
├── chartUtils.js           # Chart rendering utilities
├── uiControls.js           # Shared UI control helpers
├── networkModel.js         # Network node and connection modeling
├── meshLogic.js            # Mesh networking algorithms
├── simulationEngine.js     # Core simulation engine
├── visualization.js        # Canvas rendering for network visualization
├── main-home.js            # Home page logic
├── main-dashboard.js       # Dashboard functionality
└── main-simulator.js       # Simulator page logic
```

## 🛠️ Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Graphics**: HTML5 Canvas 2D API
- **Architecture**: Static website (no build tools required)
- **Compatibility**: Works in all modern browsers (Chrome, Firefox, Edge, Safari)

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome 60+, Firefox 55+, Edge 79+, Safari 12+)
- No additional dependencies or servers required

### Installation
1. Clone or download this repository
2. Navigate to the project folder
3. Open any of the HTML files directly in your browser

```bash
# Option 1: Open directly
open index.html

# Option 2: Use a simple HTTP server (optional)
python -m http.server 8000
# Then visit http://localhost:8000
```

## 📖 Usage Guide

### **Mesh Architecture Page** (`index.html`)
- **Network Canvas**: Visual representation of the mesh network
- **Controls**: Adjust number of nodes, spreading factor, symbol duration, and noise levels
- **Topology**: Switch between mesh and star network configurations
- **Live Stats**: Monitor packets sent, delivered, average hops, and latency

### **IoT Dashboard** (`dashboard.html`)
- **Sensor Management**: Add and monitor multiple virtual sensors
- **Real-time Charts**: View sensor values, packet loss rates, and latency distributions
- **Transmission Settings**: Configure symbol duration, noise levels, and mesh depth
- **Data Visualization**: Interactive charts showing network performance over time

### **Network Simulator** (`simulator.html`)
- **Advanced Configuration**: Fine-tune network parameters
- **Performance Metrics**: Detailed statistics on network behavior
- **Interactive Controls**: Real-time adjustment of simulation parameters
- **Outcome Analysis**: Visual representation of simulation results

## 🎯 Key Concepts Demonstrated

### **LoRa Characteristics**
- **Low Data Rate**: Intentionally slow transmission for long range
- **Spread Spectrum**: Spreading factor affects range and data rate
- **Low Power**: Energy-efficient communication design
- **Long Range**: Extended communication distance

### **Mesh Networking**
- **Multi-hop Routing**: Messages relay through intermediate nodes
- **Self-healing**: Network adapts to node failures
- **Scalability**: Network grows by adding more nodes
- **Decentralization**: No single point of failure

### **Network Challenges**
- **Packet Loss**: Simulated transmission failures
- **Latency**: Variable transmission delays
- **Noise Impact**: Environmental interference effects
- **Range Limitations**: Distance-based connectivity constraints

## 🔧 Configuration Options

### **Network Parameters**
- **Number of Nodes**: 4-25 nodes in the network
- **Spreading Factor**: 7-12 (higher = longer range, slower data)
- **Symbol Duration**: 20-300ms (affects transmission speed)
- **Noise Level**: 0-100% (environmental interference)

### **Transmission Settings**
- **Mesh Depth**: Maximum number of hops (1-5)
- **Packet Size**: 8-32 bytes per packet
- **Transmission Interval**: 5-25 seconds between packets

## 🎨 Customization

### **Styling**
- All styles are in `styles.css`
- CSS variables for easy theme customization
- Responsive design with mobile-first approach
- Dark theme optimized for data visualization

### **Behavior**
- Simulation parameters in respective JavaScript files
- Network algorithms in `meshLogic.js`
- Visualization settings in `visualization.js`
- Chart configurations in `chartUtils.js`

## 🐛 Troubleshooting

### **Common Issues**
- **Charts not displaying**: Check browser console for errors
- **Slow performance**: Reduce number of nodes or increase symbol duration
- **Mobile layout issues**: Refresh page after resizing browser

### **Browser Compatibility**
- **Chrome**: Full compatibility
- **Firefox**: Full compatibility
- **Edge**: Full compatibility (version 79+)
- **Safari**: Full compatibility (version 12+)

### **Debug Mode**
Open browser console (F12) to see:
- Canvas initialization logs
- Chart rendering status
- Network simulation events
- Error messages and warnings

## 📚 Educational Value

This simulator helps understand:
- **LoRa Technology**: How low-power, long-range communication works
- **Mesh Networks**: Benefits of multi-hop routing
- **Network Trade-offs**: Range vs. speed, reliability vs. power
- **IoT Challenges**: Real-world constraints in sensor networks
- **System Design**: Balancing multiple competing requirements

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch
3. Make changes to relevant files
4. Test in multiple browsers
5. Submit a pull request

### **Code Style**
- Use ES6+ JavaScript features
- Follow existing naming conventions
- Add comments for complex logic
- Ensure cross-browser compatibility

## 📄 License

This project is provided for educational purposes. Feel free to use, modify, and distribute for learning and teaching about LoRa and mesh networking concepts.

## 🔗 Related Resources

- [LoRa Alliance Official](https://www.lora-alliance.org/)
- [Mesh Networking Fundamentals](https://en.wikipedia.org/wiki/Mesh_networking)
- [IoT Network Design](https://en.wikipedia.org/wiki/Internet_of_things)
- [Low-Power Wide-Area Networks](https://en.wikipedia.org/wiki/LPWAN)

## 📞 Support

For questions, issues, or suggestions:
1. Check the troubleshooting section above
2. Open an issue in the repository
3. Review the browser console for technical details

---

**Note**: This is a conceptual simulator designed for educational purposes. It does not provide RF-accurate simulations but rather demonstrates the key concepts and trade-offs in LoRa mesh networking.
