import React, { useState } from 'react';
import { LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, TrendingUp, Layers, BarChart3 } from 'lucide-react';

const ProductAnalysisDashboard = () => {
  const [data, setData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [clusterResults, setClusterResults] = useState(null);
  const [regressionResults, setRegressionResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [kValue, setKValue] = useState(4);
  const [isProcessing, setIsProcessing] = useState(false);

  const euclideanDistance = (point1, point2) => {
    return Math.sqrt(point1.reduce((sum, val, i) => sum + Math.pow(val - point2[i], 2), 0));
  };

  const initializeCentroids = (data, k) => {
    const centroids = [];
    const indices = new Set();
    while (centroids.length < k) {
      const idx = Math.floor(Math.random() * data.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        centroids.push([...data[idx]]);
      }
    }
    return centroids;
  };

  const assignClusters = (data, centroids) => {
    return data.map(point => {
      let minDist = Infinity;
      let cluster = 0;
      centroids.forEach((centroid, i) => {
        const dist = euclideanDistance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          cluster = i;
        }
      });
      return cluster;
    });
  };

  const updateCentroids = (data, assignments, k) => {
    const newCentroids = Array(k).fill(null).map(() => Array(data[0].length).fill(0));
    const counts = Array(k).fill(0);
    
    assignments.forEach((cluster, i) => {
      counts[cluster]++;
      data[i].forEach((val, j) => {
        newCentroids[cluster][j] += val;
      });
    });
    
    return newCentroids.map((centroid, i) => 
      counts[i] > 0 ? centroid.map(val => val / counts[i]) : centroid
    );
  };

  const calculateWCSS = (data, assignments, centroids) => {
    return data.reduce((sum, point, i) => {
      return sum + Math.pow(euclideanDistance(point, centroids[assignments[i]]), 2);
    }, 0);
  };

  const kMeans = (data, k, maxIterations = 100) => {
    let centroids = initializeCentroids(data, k);
    let assignments = [];
    let prevWCSS = Infinity;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      assignments = assignClusters(data, centroids);
      const newCentroids = updateCentroids(data, assignments, k);
      const wcss = calculateWCSS(data, assignments, centroids);
      
      if (Math.abs(prevWCSS - wcss) < 0.0001) break;
      
      centroids = newCentroids;
      prevWCSS = wcss;
    }
    
    return { assignments, centroids, wcss: calculateWCSS(data, assignments, centroids) };
  };

  const preprocessData = (rawData) => {
    const rows = rawData.trim().split('\n');
    const headers = rows[0].split(',');
    const records = rows.slice(1).map(row => {
      const values = row.split(',');
      const obj = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });

    const cleanedRecords = records.filter(record => {
      const requiredFields = ['price', 'cost', 'units_sold', 'profit'];
      return requiredFields.every(field => record[field] && record[field] !== '');
    });

    const numericRecords = cleanedRecords.map(record => {
      return {
        product_id: record.product_id,
        product_name: record.product_name,
        category: record.category,
        price: parseFloat(record.price),
        cost: parseFloat(record.cost),
        units_sold: parseInt(record.units_sold),
        promotion_frequency: parseInt(record.promotion_frequency || 0),
        shelf_level: parseInt(record.shelf_level || 3),
        profit: parseFloat(record.profit)
      };
    });

    const removeOutliers = (data, field) => {
      const values = data.map(d => d[field]).sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      return data.filter(d => d[field] >= lowerBound && d[field] <= upperBound);
    };

    let filtered = numericRecords;
    ['price', 'units_sold', 'profit'].forEach(field => {
      filtered = removeOutliers(filtered, field);
    });

    const features = ['price', 'units_sold', 'promotion_frequency'];
    const normalized = filtered.map(record => {
      const norm = {};
      features.forEach(feature => {
        const values = filtered.map(r => r[feature]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        norm[feature] = (record[feature] - min) / (max - min);
      });
      return { ...record, normalized: norm };
    });

    return { cleaned: filtered, normalized };
  };

  const performClustering = (data) => {
    const features = ['price', 'units_sold', 'promotion_frequency'];
    const clusterData = data.map(d => features.map(f => d.normalized[f]));

    const elbowData = [];
    for (let k = 2; k <= 8; k++) {
      const result = kMeans(clusterData, k);
      elbowData.push({ k, wcss: result.wcss });
    }

    const result = kMeans(clusterData, kValue);
    const assignments = result.assignments;

    const clusterStats = Array(kValue).fill(null).map(() => {
      return {
        count: 0,
        totalPrice: 0,
        totalUnits: 0,
        totalProfit: 0,
        totalPromo: 0
      };
    });

    assignments.forEach((cluster, i) => {
      clusterStats[cluster].count++;
      clusterStats[cluster].totalPrice += data[i].price;
      clusterStats[cluster].totalUnits += data[i].units_sold;
      clusterStats[cluster].totalProfit += data[i].profit;
      clusterStats[cluster].totalPromo += data[i].promotion_frequency;
    });

    const generateClusterName = (stats) => {
      const avgPrice = stats.totalPrice / stats.count;
      const avgUnits = stats.totalUnits / stats.count;
      
      if (avgPrice < 3 && avgUnits > 500) return 'Budget Best-Sellers';
      if (avgPrice > 7 && avgUnits < 200) return 'Premium Low-Volume';
      if (avgPrice >= 3 && avgPrice <= 7) return 'Mid-Range Steady';
      if (avgUnits > 600) return 'High-Volume Movers';
      return 'Premium Products';
    };

    const clusterInfo = clusterStats.map((stats, i) => {
      return {
        cluster: i,
        name: generateClusterName(stats),
        count: stats.count,
        avgPrice: (stats.totalPrice / stats.count).toFixed(2),
        avgUnits: Math.round(stats.totalUnits / stats.count),
        avgProfit: (stats.totalProfit / stats.count).toFixed(2),
        avgPromo: (stats.totalPromo / stats.count).toFixed(1)
      };
    });

    const scatterData = data.map((d, i) => {
      return {
        price: d.price,
        units_sold: d.units_sold,
        cluster: assignments[i]
      };
    });

    return { elbowData, clusterInfo, scatterData };
  };

  const transpose = (matrix) => {
    return matrix[0].map((col, i) => matrix.map(row => row[i]));
  };

  const matrixMultiply = (A, B) => {
    return A.map(rowA => 
      B[0].map((col, j) => 
        rowA.reduce((sum, val, k) => sum + val * B[k][j], 0)
      )
    );
  };

  const matrixInverse = (matrix) => {
    const n = matrix.length;
    const identity = Array(n).fill(0).map((v, i) => 
      Array(n).fill(0).map((v2, j) => i === j ? 1 : 0)
    );
    const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

    for (let i = 0; i < n; i++) {
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      const temp = augmented[i];
      augmented[i] = augmented[maxRow];
      augmented[maxRow] = temp;

      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }

      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }

    return augmented.map(row => row.slice(n));
  };

  const multipleLinearRegression = (X, y) => {
    const XT = transpose(X);
    const XTX = matrixMultiply(XT, X);
    const XTXinv = matrixInverse(XTX);
    const XTy = XT.map(row => row.reduce((sum, val, i) => sum + val * y[i], 0));
    return XTXinv.map(row => row.reduce((sum, val, i) => sum + val * XTy[i], 0));
  };

  const calculateMSE = (actual, predicted) => {
    return actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / actual.length;
  };

  const calculateMAE = (actual, predicted) => {
    return actual.reduce((sum, val, i) => sum + Math.abs(val - predicted[i]), 0) / actual.length;
  };

  const performRegression = (data) => {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const splitIdx = Math.floor(shuffled.length * 0.7);
    const train = shuffled.slice(0, splitIdx);
    const test = shuffled.slice(splitIdx);

    const X = train.map(d => [1, d.price, d.cost, d.units_sold, d.promotion_frequency]);
    const y = train.map(d => d.profit);
    const weights = multipleLinearRegression(X, y);

    const testX = test.map(d => [1, d.price, d.cost, d.units_sold, d.promotion_frequency]);
    const testPred = testX.map(x => x.reduce((sum, val, i) => sum + val * weights[i], 0));
    const testActual = test.map(d => d.profit);

    const linearMSE = calculateMSE(testActual, testPred);
    const linearMAE = calculateMAE(testActual, testPred);

    const createPolyFeatures = (p, c, u, pr) => {
      return [1, p, c, u, pr, p*p, c*c, u*u, p*u, c*u];
    };

    const XPoly = train.map(d => createPolyFeatures(d.price, d.cost, d.units_sold, d.promotion_frequency));
    const yPoly = train.map(d => d.profit);
    const weightsPoly = multipleLinearRegression(XPoly, yPoly);

    const testXPoly = test.map(d => createPolyFeatures(d.price, d.cost, d.units_sold, d.promotion_frequency));
    const testPredPoly = testXPoly.map(x => x.reduce((sum, val, i) => sum + val * weightsPoly[i], 0));

    const polyMSE = calculateMSE(testActual, testPredPoly);
    const polyMAE = calculateMAE(testActual, testPredPoly);

    const bestPreds = linearMSE < polyMSE ? testPred : testPredPoly;
    const plotData = testActual.map((actual, i) => {
      return { actual, predicted: bestPreds[i] };
    });

    return {
      linearResults: { mse: linearMSE, mae: linearMAE },
      polyResults: { mse: polyMSE, mae: polyMAE },
      plotData,
      bestModel: linearMSE < polyMSE ? 'Linear' : 'Polynomial'
    };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setData(text);
        
        const result = preprocessData(text);
        setProcessedData(result);
        
        setTimeout(() => {
          const clustering = performClustering(result.normalized);
          setClusterResults(clustering);
          
          const regression = performRegression(result.cleaned);
          setRegressionResults(regression);
          
          setIsProcessing(false);
        }, 500);
      };
      reader.readAsText(file);
    }
  };

  const getBusinessInsight = (name) => {
    const insights = {
      'Budget Best-Sellers': 'Focus on maintaining stock levels and optimizing shelf placement.',
      'Premium Low-Volume': 'Consider targeted promotions for quality-focused customers.',
      'Mid-Range Steady': 'Maintain consistent inventory and consider bundling strategies.',
      'High-Volume Movers': 'Prioritize supply chain efficiency and bulk promotions.',
      'Premium Products': 'Focus on quality presentation and exclusive marketing.'
    };
    return insights[name] || 'Analyze customer preferences and adjust strategies.';
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">Product Performance Analysis</h1>
            <p className="text-blue-100">Machine Learning Dashboard - K-means Clustering and Regression Analysis</p>
          </div>

          {!data && (
            <div className="p-12">
              <div className="border-4 border-dashed border-blue-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <h2 className="text-2xl font-semibold mb-2 text-gray-700">Upload Product Sales Data</h2>
                <p className="text-gray-500 mb-4">Upload your product_sales.csv file to begin analysis</p>
                <label className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  Choose File
                </label>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xl text-gray-600">Processing data and running algorithms...</p>
            </div>
          )}

          {data && !isProcessing && processedData && (
            <>
              <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={'flex items-center gap-2 px-6 py-4 font-medium transition-colors ' + (activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-800')}
                >
                  <BarChart3 className="w-5 h-5" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('clustering')}
                  className={'flex items-center gap-2 px-6 py-4 font-medium transition-colors ' + (activeTab === 'clustering' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-800')}
                >
                  <Layers className="w-5 h-5" />
                  K-means Clustering
                </button>
                <button
                  onClick={() => setActiveTab('regression')}
                  className={'flex items-center gap-2 px-6 py-4 font-medium transition-colors ' + (activeTab === 'regression' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-800')}
                >
                  <TrendingUp className="w-5 h-5" />
                  Regression Analysis
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6">Data Overview</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Total Products</h3>
                        <p className="text-4xl font-bold">{processedData.cleaned.length}</p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Avg Profit</h3>
                        <p className="text-4xl font-bold">
                          ${(processedData.cleaned.reduce((sum, d) => sum + d.profit, 0) / processedData.cleaned.length).toFixed(0)}
                        </p>
                      </div>
                      
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Avg Units Sold</h3>
                        <p className="text-4xl font-bold">
                          {Math.round(processedData.cleaned.reduce((sum, d) => sum + d.units_sold, 0) / processedData.cleaned.length)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mt-8">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Preprocessing Summary</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>✓ Missing values handled using record removal strategy</li>
                        <li>✓ Outliers detected and removed using IQR method</li>
                        <li>✓ Features normalized using Min-Max scaling (0-1 range)</li>
                        <li>✓ Dataset cleaned and ready for analysis</li>
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'clustering' && clusterResults && (
                  <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-gray-800">K-means Clustering Analysis</h2>

                    <div className="bg-blue-50 rounded-xl p-6">
                      <label className="block text-lg font-semibold mb-3 text-gray-800">
                        Select Number of Clusters (k): {kValue}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        value={kValue}
                        onChange={(e) => {
                          setKValue(parseInt(e.target.value));
                          const clustering = performClustering(processedData.normalized);
                          setClusterResults(clustering);
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-600 mt-2">
                        <span>2</span>
                        <span>8</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Elbow Method</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={clusterResults.elbowData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="k" label={{ value: 'Number of Clusters (k)', position: 'insideBottom', offset: -5 }} />
                          <YAxis label={{ value: 'WCSS', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="wcss" stroke="#3b82f6" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Cluster Visualization</h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="price" label={{ value: 'Price ($)', position: 'insideBottom', offset: -5 }} />
                          <YAxis dataKey="units_sold" label={{ value: 'Units Sold', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          {Array.from({ length: kValue }).map((v, i) => (
                            <Scatter
                              key={i}
                              name={clusterResults.clusterInfo[i] ? clusterResults.clusterInfo[i].name : 'Cluster ' + i}
                              data={clusterResults.scatterData.filter(d => d.cluster === i)}
                              fill={COLORS[i]}
                            />
                          ))}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Cluster Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clusterResults.clusterInfo.map((cluster, i) => (
                          <div key={i} className="border-2 rounded-lg p-4" style={{ borderColor: COLORS[i] }}>
                            <h4 className="text-lg font-bold mb-3" style={{ color: COLORS[i] }}>
                              {cluster.name}
                            </h4>
                            <div className="space-y-2 text-sm text-gray-700">
                              <p><strong>Products:</strong> {cluster.count}</p>
                              <p><strong>Avg Price:</strong> ${cluster.avgPrice}</p>
                              <p><strong>Avg Units Sold:</strong> {cluster.avgUnits}</p>
                              <p><strong>Avg Profit:</strong> ${cluster.avgProfit}</p>
                              <p><strong>Avg Promotions:</strong> {cluster.avgPromo}/month</p>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600 italic">
                                {getBusinessInsight(cluster.name)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'regression' && regressionResults && (
                  <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-gray-800">Regression Analysis</h2>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Model Performance</h3>
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Model</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">MSE</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">MAE</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-6 py-4 text-sm">Linear Regression</td>
                            <td className="px-6 py-4 text-sm">{regressionResults.linearResults.mse.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">{regressionResults.linearResults.mae.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">
                              {regressionResults.bestModel === 'Linear' ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Best</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Good</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm">Polynomial Regression</td>
                            <td className="px-6 py-4 text-sm">{regressionResults.polyResults.mse.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">{regressionResults.polyResults.mae.toFixed(2)}</td>
                            <td className="px-6 py-4 text-sm">
                              {regressionResults.bestModel === 'Polynomial' ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Best</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">Good</span>
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-lg">
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Actual vs Predicted</h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="actual" label={{ value: 'Actual Profit ($)', position: 'insideBottom', offset: -5 }} />
                          <YAxis dataKey="predicted" label={{ value: 'Predicted Profit ($)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Legend />
                          <Scatter name="Predictions" data={regressionResults.plotData} fill="#3b82f6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                      <p className="text-sm text-gray-600 mt-4">
                        Points closer to the diagonal line indicate more accurate predictions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductAnalysisDashboard;