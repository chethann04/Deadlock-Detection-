import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Calculator, FileText, Play, Plus, Trash2, Moon, Sun, Info, Zap, Shield, Award } from 'lucide-react';
import { DataSet } from 'vis-data/standalone';
import { Network } from 'vis-network/standalone';

export default function BankersAlgorithm() {
  const [processes, setProcesses] = useState(5);
  const [resources, setResources] = useState(3);
  const [allocation, setAllocation] = useState([]);
  const [max, setMax] = useState([]);
  const [available, setAvailable] = useState([]);
  const [need, setNeed] = useState([]);
  const [safeSequence, setSafeSequence] = useState([]);
  const [isDeadlock, setIsDeadlock] = useState(false);
  const [step, setStep] = useState(0);
  const [showNeed, setShowNeed] = useState(false);
  const [showAvailable, setShowAvailable] = useState(false);
  const [showSequence, setShowSequence] = useState(false);
  const [inputMode, setInputMode] = useState(true);
  const [operations, setOperations] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  // Graph states
  const [showGraphs, setShowGraphs] = useState(false);
  const [resourceAllocationGraph, setResourceAllocationGraph] = useState(null);
  const [waitForGraph, setWaitForGraph] = useState(null);
  const [activeGraphTab, setActiveGraphTab] = useState('both'); // 'both', 'resource', 'wait'
  const [graphAnimation, setGraphAnimation] = useState(false);
  const [isAnimatingRequests, setIsAnimatingRequests] = useState(false);
  const [requestAnimationStep, setRequestAnimationStep] = useState(0);
  // Refs for graph containers
  const resourceAllocationGraphRef = useRef(null);
  const waitForGraphRef = useRef(null);
  const resourceAllocationNetworkRef = useRef(null);
  const waitForNetworkRef = useRef(null);
  // Animation states
  const [themeTransition, setThemeTransition] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [operationLogVisible, setOperationLogVisible] = useState(false);

  // Handle theme transition effect
  useEffect(() => {
    setThemeTransition(true);
    const timer = setTimeout(() => {
      setThemeTransition(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [darkMode]);

  // Handle result visibility
  useEffect(() => {
    if (showSequence || showNeed || showAvailable) {
      setResultVisible(true);
    } else {
      setResultVisible(false);
    }
  }, [showSequence, showNeed, showAvailable]);

  // Handle operation log visibility
  useEffect(() => {
    if (operations.length > 0) {
      setOperationLogVisible(true);
    } else {
      setOperationLogVisible(false);
    }
  }, [operations]);

  // Render graphs when data changes
  useEffect(() => {
    // Check if we need to render resource allocation graph
    const shouldRenderResourceGraph = (activeGraphTab === 'both' || activeGraphTab === 'resource') && 
                                     resourceAllocationGraph && resourceAllocationGraphRef.current;
    
    // Check if we need to render wait-for graph
    const shouldRenderWaitGraph = (activeGraphTab === 'both' || activeGraphTab === 'wait') && 
                                 waitForGraph && waitForGraphRef.current;
    
    if (showGraphs && (shouldRenderResourceGraph || shouldRenderWaitGraph)) {
      
      // Destroy existing networks if they exist based on what we need to render
      if (shouldRenderResourceGraph && resourceAllocationNetworkRef.current) {
        resourceAllocationNetworkRef.current.destroy();
        resourceAllocationNetworkRef.current = null;
      }
      if (shouldRenderWaitGraph && waitForNetworkRef.current) {
        waitForNetworkRef.current.destroy();
        waitForNetworkRef.current = null;
      }
      
      // Render resource allocation graph if needed
      if (shouldRenderResourceGraph) {
        // Create nodes and edges datasets for resource allocation graph
        const raNodes = new DataSet(resourceAllocationGraph.nodes);
        const raEdges = new DataSet(resourceAllocationGraph.edges);
        
        // Options for resource allocation graph
        const raOptions = {
          nodes: {
            font: {
              size: 20,
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
              size: 14,
              align: 'horizontal',
              strokeWidth: 4,
              strokeColor: '#000000',
              color: '#ffffff'
            },
            color: {
              color: '#848484',
              highlight: '#848484',
              hover: '#848484'
            },
            smooth: {
              type: 'continuous'
            },
            width: 2
          },
          physics: {
            enabled: true,
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
            zoomView: true
          },
          layout: {
            improvedLayout: true,
            hierarchical: false
          }
        };
        
        // Update node shapes based on type with more vibrant colors
        const styledRaNodes = resourceAllocationGraph.nodes.map(node => ({
          ...node,
          shape: node.type === 'process' ? 'box' : 'ellipse',
          color: {
            background: node.type === 'process' ? '#FF6B6B' : '#4ECDC4',
            border: node.type === 'process' ? '#FF0000' : '#1A535C',
            highlight: {
              background: node.type === 'process' ? '#FF0000' : '#1A535C',
              border: node.type === 'process' ? '#CC0000' : '#0D2B2F'
            }
          },
          font: {
            size: 14,
            color: '#ffffff',
            face: 'Arial',
            strokeWidth: 1,
            strokeColor: '#000000'
          },
          size: node.type === 'process' ? 25 : 20
        }));
        
        // Style edges differently for allocation vs request with vibrant colors
        const styledRaEdges = resourceAllocationGraph.edges.map(edge => ({
          ...edge,
          width: 2,
          font: {
            size: 10,
            align: 'top',
            strokeWidth: 2,
            strokeColor: '#000000',
            color: '#ffffff'
          },
          color: {
            color: edge.dashes ? '#E74C3C' : '#3498DB',
            highlight: edge.dashes ? '#C0392B' : '#2980B9'
          },
          dashes: edge.dashes ? true : false,
          arrows: {
            to: { enabled: true, scaleFactor: 0.8 }
          },
          smooth: {
            type: 'continuous'
          }
        }));
        
        // Create networks with styled nodes and edges
        const raNodesStyled = new DataSet(styledRaNodes);
        const raEdgesStyled = new DataSet(styledRaEdges);
        
        // Create network
        resourceAllocationNetworkRef.current = new Network(
          resourceAllocationGraphRef.current, 
          { nodes: raNodesStyled, edges: raEdgesStyled }, 
          raOptions
        );
        
        // Configure network for animations
        if (resourceAllocationNetworkRef.current) {
          resourceAllocationNetworkRef.current.on('selectEdge', (params) => {
            // Handle edge selection if needed
          });
          
          // Set initial selection options
          resourceAllocationNetworkRef.current.setOptions({
            interaction: {
              selectConnectedEdges: true,
              hover: true,
              hoverConnectedEdges: true
            }
          });
        }
      }
      
      // Render wait-for graph if needed
      if (shouldRenderWaitGraph) {
        // Create nodes and edges datasets for wait-for graph
        const wfNodes = new DataSet(waitForGraph.nodes);
        const wfEdges = new DataSet(waitForGraph.edges);
        
        // Options for wait-for graph
        const wfOptions = {
          nodes: {
            font: {
              size: 20,
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
              size: 14,
              align: 'horizontal',
              strokeWidth: 4,
              strokeColor: '#000000',
              color: '#ffffff'
            },
            color: {
              color: '#ff6b6b',
              highlight: '#ff6b6b',
              hover: '#ff6b6b'
            },
            smooth: {
              type: 'curvedCW',
              roundness: 0.3
            },
            width: 2
          },
          physics: {
            enabled: true,
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
            zoomView: true
          },
          layout: {
            improvedLayout: true,
            hierarchical: false
          }
        };
        
        // Update node shapes based on type with more vibrant colors
        const styledWfNodes = waitForGraph.nodes.map(node => ({
          ...node,
          shape: 'circle',
          color: {
            background: '#9B59B6',
            border: '#8E44AD',
            highlight: {
              background: '#8E44AD',
              border: '#6C3483'
            }
          },
          font: {
            size: 14,
            color: '#ffffff',
            face: 'Arial',
            strokeWidth: 1,
            strokeColor: '#000000'
          },
          size: 25
        }));
        
        // Style edges differently for wait-for graph
        const styledWfEdges = waitForGraph.edges.map(edge => ({
          ...edge,
          width: 2,
          font: {
            size: 10,
            align: 'top',
            strokeWidth: 2,
            strokeColor: '#000000',
            color: '#ffffff'
          },
          color: {
            color: '#F39C12',
            highlight: '#E67E22'
          },
          dashes: [5, 5],
          arrows: {
            to: { enabled: true, scaleFactor: 0.8 }
          },
          smooth: {
            type: 'curvedCW',
            roundness: 0.3
          }
        }));
        
        // Create networks with styled nodes and edges
        const wfNodesStyled = new DataSet(styledWfNodes);
        const wfEdgesStyled = new DataSet(styledWfEdges);
        
        // Create network
        waitForNetworkRef.current = new Network(
          waitForGraphRef.current, 
          { nodes: wfNodesStyled, edges: wfEdgesStyled }, 
          wfOptions
        );
      }
    }
    
    // Cleanup function to destroy networks
    return () => {
      if (resourceAllocationNetworkRef.current) {
        resourceAllocationNetworkRef.current.destroy();
      }
      if (waitForNetworkRef.current) {
        waitForNetworkRef.current.destroy();
      }
    };
  }, [showGraphs, resourceAllocationGraph, waitForGraph, activeGraphTab]);

  const initializeMatrices = () => {
    const emptyAllocation = Array(processes).fill(0).map(() => Array(resources).fill(0));
    const emptyMax = Array(processes).fill(0).map(() => Array(resources).fill(0));
    const emptyAvailable = Array(resources).fill(0);
    
    setAllocation(emptyAllocation);
    setMax(emptyMax);
    setAvailable(emptyAvailable);
    setInputMode(true);
    setStep(1);
    resetResults();
  };

  const generateSample = () => {
    const numP = Math.floor(Math.random() * 3) + 4; // 4-6 processes
    const numR = Math.floor(Math.random() * 2) + 3; // 3-4 resources
    
    setProcesses(numP);
    setResources(numR);
    
    // 25% chance to generate a deadlock scenario
    const shouldGenerateDeadlock = Math.random() < 0.25;
    
    if (shouldGenerateDeadlock) {
      // Deadlock scenario: high allocation, high max needs, low available
      const sampleAllocation = Array(numP).fill(0).map(() => 
        Array(numR).fill(0).map(() => Math.floor(Math.random() * 3) + 2) // 2-4
      );
      
      const sampleMax = sampleAllocation.map(row => 
        row.map(val => val + Math.floor(Math.random() * 4) + 3) // allocation + 3-6
      );
      
      // Very low available resources to create deadlock
      const sampleAvailable = Array(numR).fill(0).map(() => 
        Math.floor(Math.random() * 2) // 0-1 (very low)
      );
      
      setAllocation(sampleAllocation);
      setMax(sampleMax);
      setAvailable(sampleAvailable);
    } else {
      // Mix of safe and borderline scenarios
      const scenarioType = Math.floor(Math.random() * 3);
      
      if (scenarioType === 0) {
        // Safe scenario: moderate allocation, reasonable needs, adequate available
        const sampleAllocation = Array(numP).fill(0).map(() => 
          Array(numR).fill(0).map(() => Math.floor(Math.random() * 4)) // 0-3
        );
        
        const sampleMax = sampleAllocation.map(row => 
          row.map(val => val + Math.floor(Math.random() * 5)) // allocation + 0-4
        );
        
        // Adequate available resources
        const sampleAvailable = Array(numR).fill(0).map(() => 
          Math.floor(Math.random() * 4) + 2 // 2-5
        );
        
        setAllocation(sampleAllocation);
        setMax(sampleMax);
        setAvailable(sampleAvailable);
      } else if (scenarioType === 1) {
        // Borderline scenario: higher allocation, tight available resources
        const sampleAllocation = Array(numP).fill(0).map(() => 
          Array(numR).fill(0).map(() => Math.floor(Math.random() * 3) + 1) // 1-3
        );
        
        const sampleMax = sampleAllocation.map(row => 
          row.map(val => val + Math.floor(Math.random() * 3) + 2) // allocation + 2-4
        );
        
        // Moderate available resources
        const sampleAvailable = Array(numR).fill(0).map(() => 
          Math.floor(Math.random() * 3) + 1 // 1-3
        );
        
        setAllocation(sampleAllocation);
        setMax(sampleMax);
        setAvailable(sampleAvailable);
      } else {
        // Mixed scenario: vary resource distribution
        const sampleAllocation = Array(numP).fill(0).map(() => 
          Array(numR).fill(0).map(() => Math.floor(Math.random() * 5)) // 0-4
        );
        
        const sampleMax = sampleAllocation.map(row => 
          row.map(val => val + Math.floor(Math.random() * 4)) // allocation + 0-3
        );
        
        // Variable available resources
        const sampleAvailable = Array(numR).fill(0).map(() => 
          Math.floor(Math.random() * 5) // 0-4
        );
        
        setAllocation(sampleAllocation);
        setMax(sampleMax);
        setAvailable(sampleAvailable);
      }
    }
    
    setInputMode(false);
    setStep(1);
    resetResults();
  };

  const resetResults = () => {
    setNeed([]);
    setSafeSequence([]);
    setIsDeadlock(false);
    setShowNeed(false);
    setShowAvailable(false);
    setShowSequence(false);
    setOperations([]);
  };

  const updateAllocation = (i, j, value) => {
    const newAllocation = [...allocation];
    newAllocation[i][j] = parseInt(value) || 0;
    setAllocation(newAllocation);
    resetResults();
  };

  const updateMax = (i, j, value) => {
    const newMax = [...max];
    newMax[i][j] = parseInt(value) || 0;
    setMax(newMax);
    resetResults();
  };

  const updateAvailable = (i, value) => {
    const newAvailable = [...available];
    newAvailable[i] = parseInt(value) || 0;
    setAvailable(newAvailable);
    resetResults();
  };

  const calculateNeed = () => {
    const ops = [];
    const needMatrix = allocation.map((alloc, i) => {
      const needRow = alloc.map((val, j) => {
        const needVal = Math.max(0, max[i][j] - val);
        ops.push({
          type: 'calculation',
          process: i,
          resource: j,
          max: max[i][j],
          allocated: val,
          need: needVal,
          formula: `Need[P${i}][R${j}] = Max[P${i}][R${j}] - Allocation[P${i}][R${j}] = ${max[i][j]} - ${val} = ${needVal}`
        });
        return needVal;
      });
      return needRow;
    });
    setNeed(needMatrix);
    setOperations(ops);
    setShowNeed(true);
    setStep(2);
  };

  const displayAvailable = () => {
    const ops = [];
    
    // Calculate total allocated for each resource
    const totalAllocated = Array(resources).fill(0);
    allocation.forEach((row, i) => {
      row.forEach((val, j) => {
        totalAllocated[j] += val;
      });
    });
    
    available.forEach((avail, i) => {
      ops.push({
        type: 'available',
        resource: i,
        available: avail,
        totalAllocated: totalAllocated[i],
        info: `Resource ${i}: Available = ${avail}, Total Allocated = ${totalAllocated[i]}`
      });
    });
    
    setOperations(prev => [...prev, ...ops]);
    setShowAvailable(true);
    setStep(3);
  };

  const findSafeSequence = () => {
    const ops = [];
    const work = [...available];
    const finish = Array(processes).fill(false);
    const sequence = [];
    const needCopy = need.map(row => [...row]);
    
    ops.push({
      type: 'init',
      message: 'Initializing Safe Sequence Detection',
      details: `Work = [${work.join(', ')}], Finish = [${finish.map(f => f ? 'T' : 'F').join(', ')}]`
    });
    
    let count = 0;
    let found = true;
    
    while (count < processes && found) {
      found = false;
      
      for (let i = 0; i < processes; i++) {
        if (!finish[i]) {
          // Check if need <= work for all resources
          let canAllocate = true;
          let comparison = '';
          
          for (let j = 0; j < resources; j++) {
            if (needCopy[i][j] > work[j]) {
              canAllocate = false;
              comparison += `Need[P${i}][R${j}](${needCopy[i][j]}) > Work[R${j}](${work[j]}) `;
            } else {
              comparison += `Need[P${i}][R${j}](${needCopy[i][j]}) ≤ Work[R${j}](${work[j]}) `;
            }
          }
          
          ops.push({
            type: 'check',
            process: i,
            canAllocate,
            message: `Checking Process P${i}`,
            comparison
          });
          
          if (canAllocate) {
            found = true;
            finish[i] = true;
            sequence.push(i);
            
            // Add allocated resources to work
            let calculation = '';
            for (let j = 0; j < resources; j++) {
              work[j] += allocation[i][j];
              calculation += `Work[R${j}] = Work[R${j}] + Allocation[P${i}][R${j}] = ${work[j] - allocation[i][j]} + ${allocation[i][j]} = ${work[j]} `;
            }
            
            ops.push({
              type: 'execute',
              process: i,
              message: `Executing Process P${i}`,
              calculation,
              sequence: [...sequence]
            });
            
            count++;
            break;
          }
        }
      }
    }
    
    const isDeadlockState = sequence.length !== processes;
    
    ops.push({
      type: 'result',
      success: !isDeadlockState,
      message: isDeadlockState ? 'Deadlock Detected - Unsafe State' : 'Safe Sequence Found',
      sequence: [...sequence],
      completed: isDeadlockState ? [...sequence] : [],
      remaining: isDeadlockState ? finish.map((f, i) => !f ? i : null).filter(i => i !== null) : []
    });
    
    setOperations(prev => [...prev, ...ops]);
    setSafeSequence(sequence);
    setIsDeadlock(isDeadlockState);
    setShowSequence(true);
    setStep(4);
  };

  const reset = () => {
    setAllocation([]);
    setMax([]);
    setAvailable([]);
    setProcesses(5);
    setResources(3);
    setInputMode(true);
    setStep(0);
    resetResults();
  };

  const lockInputs = () => {
    setInputMode(false);
  };

  // Generate resource allocation graph data
  const generateResourceAllocationGraph = () => {
    if (!allocation.length || !max.length || !available.length) return null;
    
    const nodes = [];
    const edges = [];
    
    // Add resource nodes
    for (let i = 0; i < resources; i++) {
      nodes.push({
        id: `R${i}`,
        label: `Resource ${i}\n(Available: ${available[i]})`,
        type: 'resource',
        shape: 'ellipse',
        color: '#FF6B6B'
      });
    }
    
    // Add process nodes
    for (let i = 0; i < processes; i++) {
      nodes.push({
        id: `P${i}`,
        label: `Process ${i}`,
        type: 'process',
        shape: 'box',
        color: '#4ECDC4'
      });
    }
    
    // Add allocation edges (process -> resource)
    for (let i = 0; i < processes; i++) {
      for (let j = 0; j < resources; j++) {
        if (allocation[i][j] > 0) {
          edges.push({
            from: `P${i}`,
            to: `R${j}`,
            label: `${allocation[i][j]}`,
            color: '#4ECDC4',
            arrows: 'to'
          });
        }
      }
    }
    
    // Add request edges (resource -> process)
    if (need.length) {
      for (let i = 0; i < processes; i++) {
        for (let j = 0; j < resources; j++) {
          if (need[i][j] > 0) {
            edges.push({
              from: `R${j}`,
              to: `P${i}`,
              label: `Request: ${need[i][j]}`,
              color: '#FF6B6B',
              arrows: 'to',
              dashes: true
            });
          }
        }
      }
    }
    
    return { nodes, edges };
  };

  // Generate wait-for graph data for deadlock detection
  const generateWaitForGraph = () => {
    if (!allocation.length || !need.length || !available.length) return null;
    
    const nodes = [];
    const edges = [];
    
    // Add process nodes only
    for (let i = 0; i < processes; i++) {
      nodes.push({
        id: `P${i}`,
        label: `Process ${i}`,
        type: 'process',
        shape: 'box',
        color: '#4ECDC4'
      });
    }
    
    // Add wait-for edges (Pi -> Pj if Pi is waiting for a resource held by Pj)
    for (let i = 0; i < processes; i++) {
      for (let j = 0; j < processes; j++) {
        if (i !== j) {
          let waitFor = false;
          // Check if process i is waiting for any resource held by process j
          for (let k = 0; k < resources; k++) {
            // If process i needs resource k and process j has it allocated
            if (need[i][k] > 0 && allocation[j][k] > 0) {
              // Check if available is less than what process i needs
              if (available[k] < need[i][k]) {
                waitFor = true;
                break;
              }
            }
          }
          
          if (waitFor) {
            edges.push({
              from: `P${i}`,
              to: `P${j}`,
              label: 'waits for',
              color: '#FF6B6B',
              arrows: 'to',
              dashes: true
            });
          }
        }
      }
    }
    
    return { nodes, edges };
  };

  // Generate graphs when needed
  const generateGraphs = () => {
    setGraphAnimation(true);
    const raGraph = generateResourceAllocationGraph();
    const wfGraph = generateWaitForGraph();
    
    setResourceAllocationGraph(raGraph);
    setWaitForGraph(wfGraph);
    setShowGraphs(true);
    
    // Reset animation state after a delay
    setTimeout(() => setGraphAnimation(false), 1000);
  };

  const openResourceAllocationGraph = () => {
    if (resourceAllocationGraph) {
      localStorage.setItem('graphData', JSON.stringify(resourceAllocationGraph));
      localStorage.setItem('graphType', 'resource');
      window.open('/graph-viewer', '_blank');
    }
  };

  const openWaitForGraph = () => {
    if (waitForGraph) {
      localStorage.setItem('graphData', JSON.stringify(waitForGraph));
      localStorage.setItem('graphType', 'wait');
      window.open('/graph-viewer', '_blank');
    }
  };

  const openBothGraphs = () => {
    // Open both graphs in separate tabs
    openResourceAllocationGraph();
    setTimeout(() => openWaitForGraph(), 500);
  };

  const toggleGraphView = (tab) => {
    setActiveGraphTab(tab);
  };

  const refreshGraphs = () => {
    setGraphAnimation(true);
    // Re-run graph generation
    const raGraph = generateResourceAllocationGraph();
    const wfGraph = generateWaitForGraph();
    
    setResourceAllocationGraph(raGraph);
    setWaitForGraph(wfGraph);
    
    // Reset animation state after a delay
    setTimeout(() => setGraphAnimation(false), 1000);
  };

  const animateResourceRequests = () => {
    if (!resourceAllocationGraph) return;
    
    setIsAnimatingRequests(true);
    setRequestAnimationStep(0);
    
    // Get all request edges (dashed arrows from resources to processes)
    const requestEdges = resourceAllocationGraph.edges.filter(edge => edge.dashes);
    
    if (requestEdges.length === 0) {
      setIsAnimatingRequests(false);
      return;
    }
    
    // Animate each request edge sequentially with enhanced visual effects
    const animateNext = (index) => {
      if (index >= requestEdges.length) {
        // Animation complete
        setTimeout(() => {
          // Reset all highlights
          if (resourceAllocationNetworkRef.current) {
            resourceAllocationNetworkRef.current.setSelection({
              edges: []
            });
          }
          setIsAnimatingRequests(false);
          setRequestAnimationStep(0);
        }, 1500);
        return;
      }
      
      setRequestAnimationStep(index + 1);
      
      // Highlight the current edge with enhanced styling
      if (resourceAllocationNetworkRef.current) {
        const edgeId = requestEdges[index].id;
        
        // First, highlight the edge
        resourceAllocationNetworkRef.current.setSelection({
          edges: [edgeId]
        }, {
          highlightEdges: true
        });
        
        // Get the edge data to find connected nodes
        const edgeData = resourceAllocationNetworkRef.current.body.data.edges.get(edgeId);
        if (edgeData) {
          // Briefly highlight connected nodes
          resourceAllocationNetworkRef.current.selectNodes([edgeData.from, edgeData.to], false);
        }
        
        // Add a pulsing effect by temporarily increasing edge width
        const originalWidth = requestEdges[index].width || 2;
        resourceAllocationNetworkRef.current.body.data.edges.update({
          id: edgeId,
          width: originalWidth * 2,
          color: {
            color: '#FFD700', // Gold color for emphasis
            highlight: '#FFD700'
          }
        });
        
        // Reset edge styling after a delay
        setTimeout(() => {
          if (resourceAllocationNetworkRef.current) {
            resourceAllocationNetworkRef.current.body.data.edges.update({
              id: edgeId,
              width: originalWidth,
              color: requestEdges[index].color
            });
          }
        }, 500);
      }
      
      // Continue to next edge after delay
      setTimeout(() => animateNext(index + 1), 2000);
    };
    
    // Start animation
    animateNext(0);
  };

  const stopRequestAnimation = () => {
    setIsAnimatingRequests(false);
    setRequestAnimationStep(0);
    
    // Clear selection
    if (resourceAllocationNetworkRef.current) {
      resourceAllocationNetworkRef.current.setSelection({
        edges: []
      });
    }
  };




  return (
    <div className={`min-h-screen transition-colors duration-500 ease-in-out ${themeTransition ? 'transition-all' : ''} ${darkMode ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'} p-4 sm:p-6 md:p-8`}>
      <div className="max-w-7xl mx-auto">
        <div className={`rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border transition-colors duration-500 ease-in-out relative ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Theme Toggle Button */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`absolute top-4 right-4 p-2 sm:p-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-110 ${darkMode ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900' : 'bg-gray-800 hover:bg-gray-900 text-yellow-400'}`}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5 sm:w-6 sm:h-6" /> : <Moon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 relative">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 relative transition-all duration-500`}>
              <Calculator className="w-8 h-8 sm:w-10 md:w-12 sm:h-10 md:h-12 text-blue-600 transition-transform duration-300 hover:rotate-12" />
              <span className="text-center">Banker's Algorithm Visualizer</span>
            </h1>
            <p className={`text-sm sm:text-base md:text-lg font-medium relative transition-opacity duration-500 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Interactive Deadlock Avoidance & Detection System
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-3 px-2">
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Safe State Detection</span>
                <span className="sm:hidden">Safe</span>
              </span>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                <Zap className="w-3 h-3" />
                <span className="hidden sm:inline">Real-time Analysis</span>
                <span className="sm:hidden">Analysis</span>
              </span>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-pink-900/50 text-pink-300' : 'bg-pink-100 text-pink-700'}`}>
                <Award className="w-3 h-3" />
                <span className="hidden sm:inline">Educational Tool</span>
                <span className="sm:hidden">Education</span>
              </span>
            </div>
          </div>

          {step === 0 && (
            <>
              <div className={`rounded-xl p-4 sm:p-6 md:p-8 border-2 mb-4 sm:mb-6 shadow-lg animate-fadeIn transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'}`}>
                <h2 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center gap-2`}>
                  <span className="bg-blue-600 text-white w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm">1</span>
                  Initial Configuration
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div>
                    <label className={`block mb-2 font-semibold text-sm sm:text-base transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Number of Processes:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={processes}
                      onChange={(e) => setProcesses(parseInt(e.target.value) || 1)}
                      placeholder={darkMode ? "Enter processes (1-10)" : "Enter processes (1-10)"}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-300 placeholder-opacity-70 ${darkMode ? 'bg-gray-700 border-blue-700 text-white placeholder-gray-400' : 'bg-white border-blue-200 text-gray-800 placeholder-gray-500'}`}
                    />
                  </div>
                  <div>
                    <label className={`block mb-2 font-semibold text-sm sm:text-base transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Number of Resources:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={resources}
                      onChange={(e) => setResources(parseInt(e.target.value) || 1)}
                      placeholder={darkMode ? "Enter resources (1-10)" : "Enter resources (1-10)"}
                      className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm transition-all duration-300 placeholder-opacity-70 ${darkMode ? 'bg-gray-700 border-purple-700 text-white placeholder-gray-400' : 'bg-white border-purple-200 text-gray-800 placeholder-gray-500'}`}
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <button
                    onClick={initializeMatrices}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Create Custom Input
                  </button>
                  <button
                    onClick={generateSample}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    Load Sample Data
                  </button>
                </div>
              </div>

              {/* Educational Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* What is Deadlock */}
                <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg animate-slideInLeft transition-all duration-500 delay-100 ${darkMode ? 'bg-gradient-to-br from-red-900/30 to-rose-900/30 border-red-700' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'}`}>
                  <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    <AlertCircle className="w-5 h-5" />
                    What is Deadlock?
                  </h3>
                  <div className={`space-y-2 sm:space-y-3 text-xs sm:text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p className="leading-relaxed">
                      A <strong>deadlock</strong> is a situation where a set of processes are blocked because each process is holding resources and waiting for other resources acquired by other processes.
                    </p>
                    <div className={`rounded-lg p-3 border transition-colors duration-300 ${darkMode ? 'bg-black/20 border-red-800' : 'bg-white/50 border-red-200'}`}>
                      <p className={`font-semibold mb-2 transition-colors duration-300 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Four Necessary Conditions:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                        <li><strong>Mutual Exclusion:</strong> Resources cannot be shared</li>
                        <li><strong>Hold and Wait:</strong> Processes hold resources while waiting</li>
                        <li><strong>No Preemption:</strong> Resources cannot be forcibly taken</li>
                        <li><strong>Circular Wait:</strong> Circular chain of waiting processes</li>
                      </ul>
                    </div>
                    <p className="text-xs italic text-gray-600">
                      Example: Process A holds Resource 1 and waits for Resource 2, while Process B holds Resource 2 and waits for Resource 1.
                    </p>
                  </div>
                </div>

                {/* Banker's Algorithm */}
                <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg animate-slideInRight transition-all duration-500 delay-150 ${darkMode ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`}>
                  <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>
                    <CheckCircle className="w-5 h-5" />
                    Banker's Algorithm
                  </h3>
                  <div className={`space-y-2 sm:space-y-3 text-xs sm:text-sm transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p className="leading-relaxed">
                      The <strong>Banker's Algorithm</strong> is a deadlock avoidance algorithm that tests resource allocation for safety before granting requests.
                    </p>
                    <div className={`rounded-lg p-3 border transition-colors duration-300 ${darkMode ? 'bg-black/20 border-green-800' : 'bg-white/50 border-green-200'}`}>
                      <p className={`font-semibold mb-2 transition-colors duration-300 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Key Concepts:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                        <li><strong>Safe State:</strong> System can allocate resources to all processes in some order</li>
                        <li><strong>Unsafe State:</strong> No guarantee that all processes can finish</li>
                        <li><strong>Need Matrix:</strong> Maximum - Allocation (remaining needs)</li>
                        <li><strong>Available:</strong> Currently free resources in the system</li>
                      </ul>
                    </div>
                    <p className="text-xs italic text-gray-600">
                      Named after banking system: Never allocate cash that cannot satisfy all customers' needs.
                    </p>
                  </div>
                </div>
              </div>

              {/* How it Works */}
              <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg mb-4 sm:mb-6 animate-fadeInUp transition-all duration-500 delay-200 ${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'}`}>
                  <Play className="w-5 h-5 text-purple-600" />
                  How the Algorithm Works
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className={`rounded-lg p-3 sm:p-4 border-2 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-700/50 border-purple-700' : 'bg-white/70 border-purple-200'}`}>
                    <div className="text-center mb-2">
                      <span className="inline-block bg-purple-600 text-white w-8 h-8 rounded-full text-lg font-bold">1</span>
                    </div>
                    <h4 className={`font-bold text-sm mb-2 transition-colors duration-300 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Calculate Need</h4>
                    <p className={`text-xs transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Need = Maximum - Allocation for each process</p>
                  </div>
                  <div className={`rounded-lg p-3 sm:p-4 border-2 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-700/50 border-purple-700' : 'bg-white/70 border-purple-200'}`}>
                    <div className="text-center mb-2">
                      <span className="inline-block bg-purple-600 text-white w-8 h-8 rounded-full text-lg font-bold">2</span>
                    </div>
                    <h4 className={`font-bold text-sm mb-2 transition-colors duration-300 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Find Process</h4>
                    <p className={`text-xs transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Find process where Need ≤ Available resources</p>
                  </div>
                  <div className={`rounded-lg p-3 sm:p-4 border-2 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-700/50 border-purple-700' : 'bg-white/70 border-purple-200'}`}>
                    <div className="text-center mb-2">
                      <span className="inline-block bg-purple-600 text-white w-8 h-8 rounded-full text-lg font-bold">3</span>
                    </div>
                    <h4 className={`font-bold text-sm mb-2 transition-colors duration-300 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Simulate Execution</h4>
                    <p className={`text-xs transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Process finishes and releases allocated resources</p>
                  </div>
                  <div className={`rounded-lg p-3 sm:p-4 border-2 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-700/50 border-purple-700' : 'bg-white/70 border-purple-200'}`}>
                    <div className="text-center mb-2">
                      <span className="inline-block bg-purple-600 text-white w-8 h-8 rounded-full text-lg font-bold">4</span>
                    </div>
                    <h4 className={`font-bold text-sm mb-2 transition-colors duration-300 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Repeat or Detect</h4>
                    <p className={`text-xs transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Repeat until all finish or deadlock is detected</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step >= 1 && (
            <>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-6 sm:mb-8">
                {inputMode && (
                  <button
                    onClick={lockInputs}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Lock & Proceed</span>
                    <span className="sm:hidden">Lock</span>
                  </button>
                )}
                
                {!inputMode && (
                  <>
                    <button
                      onClick={calculateNeed}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Calculate Need</span>
                      <span className="sm:hidden">Need</span>
                    </button>
                    
                    <button
                      onClick={displayAvailable}
                      disabled={step < 2}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm sm:text-base"
                    >
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Show Available</span>
                      <span className="sm:hidden">Available</span>
                    </button>
                    
                    <button
                      onClick={findSafeSequence}
                      disabled={step < 3}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Find Safe Sequence</span>
                      <span className="sm:hidden">Sequence</span>
                    </button>
                                    
                    <button
                      onClick={generateGraphs}
                      disabled={step < 3}
                      className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Show Graphs</span>
                      <span className="sm:hidden">Graphs</span>
                    </button>
                  </>
                )}
                
                <button
                  onClick={reset}
                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm sm:text-base"
                >
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Reset All</span>
                  <span className="sm:hidden">Reset</span>
                </button>
              </div>

              {/* Available Resources Section */}
              <div className={`rounded-xl p-4 sm:p-6 border-2 mb-4 sm:mb-6 shadow-lg animate-fadeIn transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
                <h2 className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2`}>
                  <span className="bg-amber-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm">A</span>
                  Available Resources
                </h2>
                <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                  {available.map((val, i) => (
                    <div key={i} className={`rounded-lg border-2 p-3 sm:p-4 shadow-sm transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-700 border-amber-700' : 'bg-white border-amber-200'}`}>
                      <div className={`text-xs mb-1 text-center transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Resource {i}</div>
                      <input
                        type="number"
                        min="0"
                        value={val}
                        onChange={(e) => updateAvailable(i, e.target.value)}
                        disabled={!inputMode}
                        className={`w-16 sm:w-20 px-2 sm:px-3 py-2 text-center text-lg sm:text-xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 ${darkMode ? 'bg-gray-800 border-amber-700 text-amber-400' : 'bg-amber-50 border-amber-300 text-amber-800'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg animate-fadeIn transition-all duration-500 delay-100 ${darkMode ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2`}>
                    <span className="bg-blue-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm">A</span>
                    Allocation Matrix
                  </h2>
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className={`w-full min-w-max transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      <thead>
                        <tr className={`border-b transition-colors duration-300 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          <th className="p-2 sm:p-3 text-center font-bold">P</th>
                          {Array(resources).fill(0).map((_, j) => (
                            <th key={j} className="p-2 sm:p-3 text-center font-bold">R{j}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allocation.map((row, i) => (
                          <tr key={i} className={`border-b transition-colors duration-300 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className="p-1 sm:p-2 text-center font-semibold text-sm sm:text-base">P{i}</td>
                            {row.map((val, j) => (
                              <td key={j} className="p-0.5 sm:p-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={val}
                                  onChange={(e) => updateAllocation(i, j, e.target.value)}
                                  disabled={!inputMode}
                                  className={`w-full px-1 sm:px-2 py-0.5 sm:py-1 text-center text-sm sm:text-base font-semibold rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg animate-fadeIn transition-all duration-500 delay-150 ${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2`}>
                    <span className="bg-purple-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm">M</span>
                    Max Matrix
                  </h2>
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <table className={`w-full min-w-max transition-colors duration-300 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      <thead>
                        <tr className={`border-b transition-colors duration-300 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                          <th className="p-2 sm:p-3 text-center font-bold">P</th>
                          {Array(resources).fill(0).map((_, j) => (
                            <th key={j} className="p-2 sm:p-3 text-center font-bold">R{j}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {max.map((row, i) => (
                          <tr key={i} className={`border-b transition-colors duration-300 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className="p-1 sm:p-2 text-center font-semibold text-sm sm:text-base">P{i}</td>
                            {row.map((val, j) => (
                              <td key={j} className="p-0.5 sm:p-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={val}
                                  onChange={(e) => updateMax(i, j, e.target.value)}
                                  disabled={!inputMode}
                                  className={`w-full px-1 sm:px-2 py-0.5 sm:py-1 text-center text-sm sm:text-base font-semibold rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {showNeed && need.length > 0 && (
            <div className={`rounded-xl p-4 sm:p-6 border-2 mb-4 sm:mb-6 shadow-lg animate-fadeIn transition-all duration-500 ${resultVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${darkMode ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-green-700' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'}`}>
              <h2 className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2`}>
                <span className="bg-green-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm">N</span>
                Need Matrix
              </h2>
              <p className={`text-xs sm:text-sm mb-3 sm:mb-4 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Need = Max - Allocation</p>
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className={`w-full min-w-max transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                  <thead>
                    <tr className={`border-b transition-colors duration-300 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                      <th className="p-2 sm:p-3 text-center font-bold">Process</th>
                      {Array(resources).fill(0).map((_, j) => (
                        <th key={j} className="p-2 sm:p-3 text-center font-bold">R{j}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {need.map((row, i) => (
                      <tr key={i} className={`border-b transition-colors duration-300 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className="p-1 sm:p-2 text-center font-semibold text-sm sm:text-base">P{i}</td>
                        {row.map((val, j) => (
                          <td key={j} className={`p-1 sm:p-2 text-center font-bold rounded-lg border text-sm sm:text-base transition-all duration-300 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showAvailable && available.length > 0 && (
            <div className={`rounded-xl p-4 sm:p-6 border-2 mb-4 sm:mb-6 shadow-lg animate-fadeIn transition-all duration-500 ${resultVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${darkMode ? 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-700' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
              <h2 className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2`}>
                <span className="bg-amber-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm">A</span>
                Available Resources
              </h2>
              <p className={`text-xs sm:text-sm mb-3 sm:mb-4 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Resources currently available in the system</p>
              <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                {available.map((val, i) => (
                  <div key={i} className={`rounded-lg border-2 p-3 sm:p-4 text-center shadow-sm transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-700 border-amber-700' : 'bg-white border-amber-200'}`}>
                    <div className={`text-xs mb-1 transition-colors duration-300 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Resource {i}</div>
                    <div className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showSequence && (
            <div className={`rounded-xl p-4 sm:p-6 border-2 mb-4 sm:mb-6 shadow-lg animate-fadeIn transition-all duration-500 ${resultVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${
              isDeadlock 
                ? (darkMode ? 'bg-gradient-to-br from-red-900/40 to-rose-900/40 border-red-700' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200')
                : (darkMode ? 'bg-gradient-to-br from-blue-900/30 via-purple-900/30 to-pink-900/30 border-purple-700' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200')
            }`}>
              {isDeadlock ? (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4 transition-all duration-500 ${
                    darkMode ? 'bg-red-900/50' : 'bg-red-100'
                  }`}>
                    <AlertCircle className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300 ${
                      darkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 transition-colors duration-300 ${
                    darkMode ? 'text-red-400' : 'text-red-700'
                  }`}>DEADLOCK DETECTED</h2>
                  <p className={`text-sm sm:text-base mb-4 transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>The system is in an unsafe state. No safe sequence exists.</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    darkMode ? 'bg-red-900/30' : 'bg-red-100'
                  }`}>
                    <AlertCircle className={`w-5 h-5 transition-colors duration-300 ${
                      darkMode ? 'text-red-400' : 'text-red-600'
                    }`} />
                    <span className={`font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-red-400' : 'text-red-700'
                    }`}>Unsafe State</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full mb-3 sm:mb-4 transition-all duration-500 ${
                    darkMode ? 'bg-green-900/50' : 'bg-green-100'
                  }`}>
                    <CheckCircle className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-300 ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 transition-colors duration-300 ${
                    darkMode ? 'text-green-400' : 'text-green-700'
                  }`}>Safe Sequence Found</h2>
                  <div className="flex gap-2 sm:gap-3 justify-center items-center flex-wrap mb-4">
                    {safeSequence.map((process, index) => (
                      <React.Fragment key={index}>
                        <div className={`font-bold text-lg sm:text-xl px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-md animate-popIn transition-all duration-300 delay-${index * 100} ${
                          darkMode 
                            ? 'bg-gradient-to-r from-green-700 to-emerald-700 text-green-100' 
                            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        }`}>
                          P{process}
                        </div>
                        {index < safeSequence.length - 1 && (
                          <span className={`text-xl sm:text-2xl font-bold transition-colors duration-300 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className={`text-sm sm:text-base mb-4 transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>The system is in a safe state and can avoid deadlock</p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    darkMode ? 'bg-green-900/30' : 'bg-green-100'
                  }`}>
                    <CheckCircle className={`w-5 h-5 transition-colors duration-300 ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <span className={`font-semibold transition-colors duration-300 ${
                      darkMode ? 'text-green-400' : 'text-green-700'
                    }`}>Safe State</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {operations.length > 0 && (
            <div className={`rounded-xl p-4 sm:p-6 border-2 mb-4 sm:mb-6 shadow-lg animate-fadeIn transition-all duration-500 ${operationLogVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${
              darkMode 
                ? 'bg-gradient-to-br from-slate-800 to-gray-800 border-slate-600' 
                : 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-200'
            }`}>
              <h2 className={`text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent mb-3 sm:mb-4 flex items-center gap-2`}>
                <span className="bg-slate-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm">S</span>
                Step-by-Step Execution
              </h2>
              <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {operations.map((op, index) => (
                  <div key={index} className={`rounded-lg p-3 sm:p-4 border-2 shadow-sm transition-all duration-300 hover:shadow-md animate-fadeInSlide ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                  }`}>
                    {op.type === 'calculation' && (
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          darkMode ? 'bg-gradient-to-br from-blue-700 to-cyan-700' : 'bg-gradient-to-br from-blue-400 to-cyan-400'
                        }`}>
                          <Calculator className={`w-4 h-4 transition-colors duration-300 text-white`} />
                        </div>
                        <div>
                          <div className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-blue-300' : 'text-blue-700'
                          }`}>Calculation: P{op.process} - R{op.resource}</div>
                          <div className={`text-xs font-mono rounded border p-2 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'
                          }`}>{op.formula}</div>
                        </div>
                      </div>
                    )}
                    
                    {op.type === 'available' && (
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          darkMode ? 'bg-gradient-to-br from-amber-600 to-orange-600' : 'bg-gradient-to-br from-amber-400 to-orange-600'
                        }`}>
                          <AlertCircle className={`w-4 h-4 transition-colors duration-300 text-white`} />
                        </div>
                        <div>
                          <div className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-amber-300' : 'text-amber-700'
                          }`}>Available Resources</div>
                          <div className={`text-sm rounded border p-2 transition-colors duration-300 ${
                            darkMode ? 'bg-amber-900/30 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
                          }`}>{op.info}</div>
                        </div>
                      </div>
                    )}
                    
                    {op.type === 'init' && (
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          darkMode ? 'bg-gradient-to-br from-purple-700 to-pink-700' : 'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                          <Play className={`w-4 h-4 transition-colors duration-300 text-white`} />
                        </div>
                        <div>
                          <div className={`font-semibold text-sm mb-1 transition-colors duration-300 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                            {op.message}
                          </div>
                          <div className={`text-sm rounded border p-2 transition-colors duration-300 ${darkMode ? 'bg-purple-900/30 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800'}`}>
                            {op.details}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {op.type === 'check' && (
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          op.canAllocate 
                            ? (darkMode ? 'bg-gradient-to-br from-green-700 to-emerald-700' : 'bg-gradient-to-br from-green-500 to-emerald-500') 
                            : (darkMode ? 'bg-gradient-to-br from-orange-700 to-red-700' : 'bg-gradient-to-br from-orange-500 to-red-500')
                        }`}>
                          <span className={`font-bold transition-colors duration-300 text-white`}>
                            {op.canAllocate ? '✓' : '✗'}
                          </span>
                        </div>
                        <div>
                          <div className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>{op.message}</div>
                          <div className={`text-xs rounded border p-2 mb-2 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}>{op.comparison}</div>
                          <div className={`text-xs font-medium inline-block px-2 py-1 rounded transition-colors duration-300 ${
                            op.canAllocate 
                              ? (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-700') 
                              : (darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-700')
                          }`}>
                            {op.canAllocate ? '✓ Can execute' : '✗ Cannot execute yet'}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {op.type === 'execute' && (
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          darkMode ? 'bg-gradient-to-br from-green-700 to-teal-700' : 'bg-gradient-to-br from-green-500 to-teal-500'
                        }`}>
                          <CheckCircle className={`w-4 h-4 transition-colors duration-300 text-white`} />
                        </div>
                        <div>
                          <div className={`font-semibold text-sm mb-1 transition-colors duration-300 ${
                            darkMode ? 'text-green-300' : 'text-green-700'
                          }`}>{op.message}</div>
                          <div className={`text-xs rounded border p-2 mb-2 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800 border-gray-700 text-green-200' : 'bg-gray-50 border-gray-200 text-green-800'
                          }`}>Work: {op.calculation}</div>
                          <div className={`text-xs rounded border p-2 transition-colors duration-300 ${
                            darkMode ? 'bg-blue-900/30 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-600'
                          }`}>
                            Sequence: [{op.sequence.map(p => 'P' + p).join(' → ')}]
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {op.type === 'result' && (
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                          op.success 
                            ? (darkMode ? 'bg-gradient-to-br from-green-700 to-emerald-700' : 'bg-gradient-to-br from-green-500 to-emerald-500') 
                            : (darkMode ? 'bg-gradient-to-br from-red-700 to-rose-700' : 'bg-gradient-to-br from-red-500 to-rose-500')
                        }`}>
                          {op.success ? 
                            <CheckCircle className={`w-4 h-4 transition-colors duration-300 text-white`} /> : 
                            <AlertCircle className={`w-4 h-4 transition-colors duration-300 text-white`} />
                          }
                        </div>
                        <div>
                          <div className={`font-semibold transition-colors duration-300 ${
                            op.success 
                              ? (darkMode ? 'text-green-300' : 'text-green-700') 
                              : (darkMode ? 'text-red-300' : 'text-red-700')
                          }`}>
                            {op.message}
                          </div>
                          {op.success && (
                            <div className={`text-sm mt-2 rounded border p-2 transition-colors duration-300 ${
                              darkMode ? 'bg-green-900/30 border-green-800 text-green-200' : 'bg-green-50 border-green-200 text-green-800'
                            }`}>
                              Safe Sequence: [{op.sequence.map(p => 'P' + p).join(' → ')}]
                            </div>
                          )}
                          {!op.success && op.completed && op.completed.length > 0 && (
                            <div className={`text-sm mt-2 rounded border p-2 transition-colors duration-300 ${
                              darkMode ? 'bg-red-900/30 border-red-800 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                              Completed: [{op.completed.map(p => 'P' + p).join(', ')}]<br/>
                              Deadlocked: [{op.remaining.map(p => 'P' + p).join(', ')}]
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Graph Visualization Section */}
          {showGraphs && (
            <div className={`rounded-xl p-4 sm:p-6 border-2 mb-4 sm:mb-6 shadow-lg animate-fadeIn transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-700' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200'}`}>
              <h2 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 flex items-center gap-2`}>
                <span className="bg-indigo-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm">G</span>
                Graph Visualization
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={openResourceAllocationGraph}
                  disabled={!resourceAllocationGraph}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  Fullscreen Resource Graph
                </button>
                
                <button
                  onClick={openWaitForGraph}
                  disabled={!waitForGraph}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  Fullscreen Wait-for Graph
                </button>
                
                <button
                  onClick={openBothGraphs}
                  disabled={!resourceAllocationGraph || !waitForGraph}
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                  Open Both Graphs
                </button>
                
                <button
                  onClick={refreshGraphs}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  Refresh Graphs
                </button>
                
                <button
                  onClick={isAnimatingRequests ? stopRequestAnimation : animateResourceRequests}
                  disabled={!resourceAllocationGraph || !showGraphs}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 ${isAnimatingRequests ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  {isAnimatingRequests ? 'Stop Animation' : 'Animate Requests'}
                </button>
              </div>
              
              {isAnimatingRequests && (
                <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-yellow-700 font-medium">Animating resource requests... Step {requestAnimationStep} of {resourceAllocationGraph?.edges?.filter(edge => edge.dashes)?.length || 0}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${resourceAllocationGraph?.edges?.filter(edge => edge.dashes)?.length ? (requestAnimationStep / resourceAllocationGraph.edges.filter(edge => edge.dashes).length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {/* Graph Tabs */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => toggleGraphView('both')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${activeGraphTab === 'both' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Show Both Graphs
                </button>
                
                <button
                  onClick={() => toggleGraphView('resource')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${activeGraphTab === 'resource' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  Resource Allocation Only
                </button>
                
                <button
                  onClick={() => toggleGraphView('wait')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${activeGraphTab === 'wait' ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                  Wait-for Graph Only
                </button>
              </div>
              
              <div className={`transition-all duration-500 ${graphAnimation ? 'opacity-70 scale-95' : 'opacity-100 scale-100'}`}>
                {activeGraphTab === 'both' || activeGraphTab === 'resource' ? (
                  <div className={`${activeGraphTab === 'both' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6' : 'block'}`}>
                    {/* Resource Allocation Graph */}
                    <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border-blue-700' : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'} ${activeGraphTab === 'resource' ? 'lg:col-span-2' : ''}`}>
                      <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        Resource Allocation Graph
                      </h3>
                      <div className="text-xs sm:text-sm mb-3 transition-colors duration-300">
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Shows how resources are currently allocated to processes and what they're requesting.
                        </p>
                        <ul className={`mt-2 space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li>• <span className="font-semibold">Boxes</span>: Processes (P0, P1, ...)</li>
                          <li>• <span className="font-semibold">Ellipses</span>: Resources (R0, R1, ...) with available count</li>
                          <li>• <span className="font-semibold">Solid arrows</span>: Current allocations (Process → Resource)</li>
                          <li>• <span className="font-semibold">Dashed arrows</span>: Pending requests (Resource → Process)</li>
                        </ul>
                      </div>
                      <div ref={resourceAllocationGraphRef} className="bg-white rounded-lg p-4 border border-gray-200 min-h-[700px] w-full h-[700px]"></div>
                      <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p className="font-semibold mb-1">How to interpret:</p>
                        <p>If a process node has outgoing solid arrows, it means it's holding those resources.</p>
                        <p>If a resource node has outgoing dashed arrows, it means processes are waiting for that resource.</p>
                      </div>
                    </div>
                    
                    {activeGraphTab === 'both' && (
                      /* Wait-for Graph */
                      <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          Wait-for Graph
                        </h3>
                        <div className="text-xs sm:text-sm mb-3 transition-colors duration-300">
                          <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Shows which processes are waiting for resources held by other processes.
                          </p>
                          <ul className={`mt-2 space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <li>• <span className="font-semibold">Nodes</span>: Processes (P0, P1, ...)</li>
                            <li>• <span className="font-semibold">Arrows</span>: Wait-for relationships (Pi → Pj means Pi waits for Pj)</li>
                            <li>• <span className="font-semibold">Cycle detection</span>: Indicates deadlock</li>
                          </ul>
                        </div>
                        <div ref={waitForGraphRef} className="bg-white rounded-lg p-4 border border-gray-200 min-h-[700px] w-full h-[700px]"></div>
                        <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <p className="font-semibold mb-1">How to interpret:</p>
                          <p>An arrow from Pi to Pj means Pi is waiting for a resource currently held by Pj.</p>
                          <p className="font-semibold mt-1">Look for cycles:</p>
                          <p>If you see a cycle (e.g., P1 → P2 → P3 → P1), it indicates a deadlock!</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Wait-for Graph Only */
                  <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-lg transition-all duration-500 ${darkMode ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
                    <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      Wait-for Graph
                    </h3>
                    <div className="text-xs sm:text-sm mb-3 transition-colors duration-300">
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Shows which processes are waiting for resources held by other processes.
                      </p>
                      <ul className={`mt-2 space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <li>• <span className="font-semibold">Nodes</span>: Processes (P0, P1, ...)</li>
                        <li>• <span className="font-semibold">Arrows</span>: Wait-for relationships (Pi → Pj means Pi waits for Pj)</li>
                        <li>• <span className="font-semibold">Cycle detection</span>: Indicates deadlock</li>
                      </ul>
                    </div>
                    <div ref={waitForGraphRef} className="bg-white rounded-lg p-4 border border-gray-200 min-h-[700px] w-full h-[700px]"></div>
                    <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <p className="font-semibold mb-1">How to interpret:</p>
                      <p>An arrow from Pi to Pj means Pi is waiting for a resource currently held by Pj.</p>
                      <p className="font-semibold mt-1">Look for cycles:</p>
                      <p>If you see a cycle (e.g., P1 → P2 → P3 → P1), it indicates a deadlock!</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`text-center text-xs sm:text-sm p-3 sm:p-4 rounded-lg ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                <p className="font-semibold mb-1">Understanding Deadlock Detection with Graphs</p>
                <p>
                  The <span className="font-semibold">Resource Allocation Graph</span> shows the current state of resource allocation and requests.
                  Rectangles represent processes, ellipses represent resources, solid arrows show allocations, and dashed arrows show requests.
                </p>
                <p className="mt-2">
                  The <span className="font-semibold">Wait-for Graph</span> simplifies this to show only process dependencies.
                  An arrow from Pi to Pj means Pi is waiting for a resource currently held by Pj.
                </p>
                <p className="mt-2 font-semibold">
                  Key Insight: A cycle in the Wait-for Graph indicates a deadlock!
                </p>
                <div className={`mt-3 p-3 rounded-lg text-left ${darkMode ? 'bg-gray-800/50' : 'bg-white border border-gray-200'}`}>
                  <p className="font-semibold mb-2 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${darkMode ? 'bg-red-500' : 'bg-red-400'}`}></span>
                    Deadlock Detection Steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-left text-xs">
                    <li>Create the Resource Allocation Graph from current system state</li>
                    <li>Convert to Wait-for Graph by removing resources and combining edges</li>
                    <li>Search for cycles in the Wait-for Graph</li>
                    <li>If a cycle exists, the system is deadlocked</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {step === 0 && (
            <div className={`text-center py-8 sm:py-12 transition-colors duration-300 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full mb-4 sm:mb-6 transition-colors duration-300 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              </div>
              <p className="text-lg sm:text-xl mb-2">Configure the number of processes and resources</p>
              <p className="text-sm sm:text-base">Then create custom input or load a sample</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}