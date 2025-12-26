import React, { useState, useEffect, useRef } from 'react';
import { DataSet } from 'vis-data/standalone';
import { Network } from 'vis-network/standalone';
import { ArrowLeft, ZoomIn, ZoomOut, Move, RotateCcw, Download, RotateCw, Pause, Play } from 'lucide-react';

const GraphViewer = () => {
  const [graphData, setGraphData] = useState(null);
  const [graphType, setGraphType] = useState('resource');
  const [isLoading, setIsLoading] = useState(true);
  const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRequestAnimating, setIsRequestAnimating] = useState(false);
  const [requestAnimationStep, setRequestAnimationStep] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const graphContainerRef = useRef(null);
  const networkRef = useRef(null);

  // Get graph data from localStorage when component mounts
  useEffect(() => {
    try {
      const savedGraphData = localStorage.getItem('graphData');
      const savedGraphType = localStorage.getItem('graphType');
      
      if (savedGraphData && savedGraphType) {
        const parsedData = JSON.parse(savedGraphData);
        setGraphData(parsedData);
        setGraphType(savedGraphType);
      } else {
        // If no data, redirect to main page
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error loading graph data:', error);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Render graph when data changes
  useEffect(() => {
    if (graphData && graphContainerRef.current) {
      // Destroy existing network if it exists
      if (networkRef.current) {
        networkRef.current.destroy();
      }

      // Create nodes and edges datasets
      const nodes = new DataSet(graphData.nodes);
      const edges = new DataSet(graphData.edges);

      // Options for the graph
      const options = {
        nodes: {
          font: {
            size: 22,
            color: '#ffffff',
            face: 'Arial',
            strokeWidth: 2,
            strokeColor: '#000000'
          },
          scaling: {
            min: 25,
            max: 40
          }
        },
        edges: {
          arrows: {
            to: { enabled: true, scaleFactor: 1.2 }
          },
          font: {
            size: 16,
            align: 'horizontal',
            strokeWidth: 4,
            strokeColor: '#000000',
            color: '#ffffff'
          },
          smooth: {
            type: graphType === 'wait' ? 'curvedCW' : 'continuous',
            roundness: 0.3
          },
          width: 3
        },
        physics: {
          enabled: isPhysicsEnabled,
          stabilization: {
            enabled: true,
            iterations: 2000
          },
          repulsion: {
            nodeDistance: 250,
            springLength: 250
          },
          hierarchicalRepulsion: {
            nodeDistance: 250
          }
        },
        interaction: {
          dragNodes: true,
          dragView: true,
          zoomView: true,
          navigationButtons: true
        },
        layout: {
          improvedLayout: true
        },
        animation: {
          duration: 1000 / animationSpeed
        }
      };

      // Create network
      networkRef.current = new Network(
        graphContainerRef.current,
        { nodes, edges },
        options
      );

      // Fit the graph to the screen
      networkRef.current.once('stabilizationIterationsDone', () => {
        networkRef.current.fit({
          animation: {
            duration: 1000,
            easingFunction: 'easeInOutQuad'
          }
        });
      });
    }

    // Cleanup function
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
      }
    };
  }, [graphData, graphType]);

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({
        scale: scale * 1.2,
        animation: { duration: 300 }
      });
    }
  };

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale();
      networkRef.current.moveTo({
        scale: scale / 1.2,
        animation: { duration: 300 }
      });
    }
  };

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({
        animation: { duration: 500 }
      });
    }
  };

  const handleReset = () => {
    if (networkRef.current) {
      networkRef.current.moveTo({
        position: { x: 0, y: 0 },
        scale: 1,
        animation: { duration: 500 }
      });
    }
  };

  const togglePhysics = () => {
    if (networkRef.current) {
      const newPhysicsState = !isPhysicsEnabled;
      setIsPhysicsEnabled(newPhysicsState);
      networkRef.current.setOptions({ physics: { enabled: newPhysicsState } });
    }
  };

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };

  const increaseSpeed = () => {
    setAnimationSpeed(prev => Math.min(prev + 0.5, 3));
  };

  const decreaseSpeed = () => {
    setAnimationSpeed(prev => Math.max(prev - 0.5, 0.5));
  };

  const exportGraph = () => {
    if (networkRef.current) {
      // Get the canvas data
      const canvas = networkRef.current.canvas;
      const dataURL = canvas.frame.canvas.toDataURL('image/png');
      
      // Create a download link
      const link = document.createElement('a');
      link.download = `${graphType}-graph.png`;
      link.href = dataURL;
      link.click();
    }
  };

  const recenterGraph = () => {
    if (networkRef.current) {
      networkRef.current.fit({
        animation: { duration: 1000 / animationSpeed }
      });
    }
  };

  const highlightCycles = () => {
    if (networkRef.current && graphData) {
      // This is a simplified cycle highlighting
      // In a real implementation, you would implement actual cycle detection
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }
  };

  const animateResourceRequests = () => {
    if (!networkRef.current || !graphData || graphType !== 'resource') return;
    
    setIsRequestAnimating(true);
    setRequestAnimationStep(0);
    
    // Get all request edges (dashed arrows from resources to processes)
    const requestEdges = graphData.edges.filter(edge => edge.dashes);
    
    if (requestEdges.length === 0) {
      setIsRequestAnimating(false);
      return;
    }
    
    // Animate each request edge sequentially with enhanced visual effects
    const animateNext = (index) => {
      if (index >= requestEdges.length) {
        // Animation complete
        setTimeout(() => {
          // Reset all highlights
          networkRef.current.setSelection({
            edges: []
          });
          setIsRequestAnimating(false);
          setRequestAnimationStep(0);
        }, 1500);
        return;
      }
      
      setRequestAnimationStep(index + 1);
      
      // Highlight the current edge with enhanced styling
      const edgeId = requestEdges[index].id;
      
      // First, highlight the edge
      networkRef.current.setSelection({
        edges: [edgeId]
      }, {
        highlightEdges: true
      });
      
      // Get the edge data to find connected nodes
      const edgeData = networkRef.current.body.data.edges.get(edgeId);
      if (edgeData) {
        // Briefly highlight connected nodes
        networkRef.current.selectNodes([edgeData.from, edgeData.to], false);
      }
      
      // Add a pulsing effect by temporarily increasing edge width
      const originalWidth = requestEdges[index].width || 3;
      networkRef.current.body.data.edges.update({
        id: edgeId,
        width: originalWidth * 2,
        color: {
          color: '#FFD700', // Gold color for emphasis
          highlight: '#FFD700'
        }
      });
      
      // Reset edge styling after a delay
      setTimeout(() => {
        if (networkRef.current) {
          networkRef.current.body.data.edges.update({
            id: edgeId,
            width: originalWidth,
            color: requestEdges[index].color
          });
        }
      }, 500);
      
      // Continue to next edge after delay
      setTimeout(() => animateNext(index + 1), 2000 / animationSpeed);
    };
    
    // Start animation
    animateNext(0);
  };

  const stopRequestAnimation = () => {
    setIsRequestAnimating(false);
    setRequestAnimationStep(0);
    
    // Clear selection
    if (networkRef.current) {
      networkRef.current.setSelection({
        edges: []
      });
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading graph data...</div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">No graph data available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {graphType === 'resource' ? 'Resource Allocation Graph' : 'Wait-for Graph'}
            </h1>
            <p className="text-gray-300">
              Fullscreen view of the {graphType === 'resource' ? 'resource allocation' : 'wait-for'} graph
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Main
            </button>
                        
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleZoomIn}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
                          
              <button
                onClick={handleZoomOut}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
                          
              <button
                onClick={handleFit}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                title="Fit to Screen"
              >
                <Move className="w-5 h-5" />
              </button>
                          
              <button
                onClick={handleReset}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-colors"
                title="Reset View"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
                          
              <button
                onClick={togglePhysics}
                className={`p-2 rounded-lg transition-colors ${isPhysicsEnabled ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                title={isPhysicsEnabled ? "Disable Physics" : "Enable Physics"}
              >
                {isPhysicsEnabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
                          
              <button
                onClick={recenterGraph}
                className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
                title="Recenter Graph"
              >
                <RotateCw className="w-5 h-5" />
              </button>
                          
              <button
                onClick={exportGraph}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors"
                title="Export Graph"
              >
                <Download className="w-5 h-5" />
              </button>
                          
              {graphType === 'resource' && (
                <button
                  onClick={isRequestAnimating ? stopRequestAnimation : animateResourceRequests}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isRequestAnimating ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
                  title={isRequestAnimating ? "Stop Request Animation" : "Animate Resource Requests"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
                        
            <div className="flex gap-2 items-center bg-gray-700 rounded-lg px-3 py-2">
              <span className="text-white text-sm mr-2">Speed:</span>
              <button
                onClick={decreaseSpeed}
                className="bg-gray-600 hover:bg-gray-500 text-white p-1 rounded transition-colors"
                title="Decrease Speed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              <span className="text-white text-sm mx-1">{animationSpeed}x</span>
              <button
                onClick={increaseSpeed}
                className="bg-gray-600 hover:bg-gray-500 text-white p-1 rounded transition-colors"
                title="Increase Speed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {isRequestAnimating && graphType === 'resource' && (
            <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-700 font-medium">Animating resource requests... Step {requestAnimationStep} of {graphData?.edges?.filter(edge => edge.dashes)?.length || 0}</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${graphData?.edges?.filter(edge => edge.dashes)?.length ? (requestAnimationStep / graphData.edges.filter(edge => edge.dashes).length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Graph Container */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 h-[calc(100vh-120px)]">
          <div 
            ref={graphContainerRef} 
            className="w-full h-full rounded-lg bg-white"
          ></div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-gray-800 rounded-xl border border-gray-700 p-4">
          <h2 className="text-xl font-bold text-white mb-3">Legend</h2>
          
          {graphType === 'resource' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Nodes</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Processes (Boxes)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                    <span>Resources (Ellipses)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Edges</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-blue-500"></div>
                    <span>Allocations (Process → Resource)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-red-500 border-dashed border-b"></div>
                    <span>Requests (Resource → Process)</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Nodes</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <span>Processes (Circles)</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Edges</h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-orange-500 border-dashed border-b"></div>
                    <span>Wait-for Relationships</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-orange-500 rounded-full"></div>
                    <span className="font-semibold">Cycle Detection: Indicates Deadlock</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GraphViewer;