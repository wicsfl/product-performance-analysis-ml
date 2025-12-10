# Product Performance Analysis - Machine Learning Dashboard

A comprehensive machine learning application for analyzing supermarket product sales data using K-means clustering and regression analysis.

![Dashboard Preview](https://img.shields.io/badge/React-18.x-blue) ![Machine Learning](https://img.shields.io/badge/ML-K--means%20%7C%20Regression-green)

## 🎯 Project Overview

This project implements machine learning algorithms from scratch to analyze product sales data, discover product groupings through clustering, and predict product performance using regression models.

### Key Features

- ✅ **K-means Clustering** - Implemented from scratch (no sklearn clustering)
- ✅ **Data Preprocessing** - Missing value handling, outlier detection (IQR method), Min-Max normalization
- ✅ **Elbow Method** - Automatic optimal k selection (k=2 to k=8)
- ✅ **Regression Analysis** - Linear and Polynomial regression models
- ✅ **Interactive Visualizations** - Real-time cluster analysis and model comparison
- ✅ **Business Insights** - Actionable recommendations for each product cluster

## 📊 Dataset

The application analyzes `product_sales.csv` containing 200 product records with features:
- Product information (ID, name, category)
- Pricing data (price, cost)
- Sales metrics (units_sold, profit)
- Marketing data (promotion_frequency, shelf_level)

## 🛠️ Technologies Used

- **React** - Frontend framework
- **Recharts** - Data visualization library
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling framework
- **Custom ML Algorithms** - K-means and regression implemented from scratch

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/wicsfl/product-performance-analysis-ml.git
cd product-performance-analysis-ml
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start the development server**
```bash
npm start
# or
yarn start
```

4. **Open your browser**
Navigate to `http://localhost:3000`

## 📁 Project Structure

```
product-performance-analysis-ml/
├── src/
│   ├── App.jsx                 # Main dashboard component
│   ├── index.css
│   └── index.js                # Entry point
├── data/
│   └── product_sales.csv       # Sample dataset
├── public/
│   └── index.html
├── package.json
└── README.md
└── tailwind.config
```

## 🎓 Machine Learning Implementation

### 1. Data Preprocessing (25%)
- **Missing Value Handling**: Record removal strategy for incomplete data
- **Outlier Detection**: IQR method (Q1 - 1.5×IQR, Q3 + 1.5×IQR)
- **Feature Normalization**: Min-Max scaling (0-1 range) for clustering

### 2. K-means Clustering (40%)
**From-Scratch Implementation:**
```javascript
// Core K-means algorithm components:
- Euclidean distance calculation
- Centroid initialization (random selection)
- Cluster assignment (nearest centroid)
- Centroid update (mean of assigned points)
- Convergence detection (WCSS threshold)
```

**Elbow Method:** Tests k=2 to k=8 to find optimal cluster count

**Cluster Types Identified:**
- Budget Best-Sellers (low price, high volume)
- Premium Low-Volume (high price, specialty items)
- Mid-Range Steady (balanced price and volume)
- High-Volume Movers (very high turnover)
- Premium Products (highest price point)

### 3. Regression Analysis (35%)
**Models Implemented:**
- **Linear Regression**: Using normal equation (X^T X)^-1 X^T y
- **Polynomial Regression**: Degree 2 with interaction terms

**Evaluation Metrics:**
- MSE (Mean Squared Error)
- MAE (Mean Absolute Error)

**Train-Test Split:** 70-30 ratio

## 📈 Usage Guide

### Step 1: Upload Data
1. Click "Choose File" button
2. Select your `product_sales.csv` file
3. Wait for processing (typically 1-2 seconds)

### Step 2: Explore Overview
- View total products, average profit, and average units sold
- Review preprocessing summary

### Step 3: Analyze Clusters
- Use the slider to adjust k value (2-8 clusters)
- Examine the elbow curve for optimal k
- View cluster statistics and business insights
- Analyze the scatter plot (Price vs Units Sold)

### Step 4: Review Regression Results
- Compare Linear vs Polynomial regression performance
- View MSE and MAE metrics
- Examine Actual vs Predicted scatter plot
- Identify the best-performing model

## 🎨 Features Breakdown

### Interactive Dashboard
- **Three-tab interface**: Overview, Clustering, Regression
- **Real-time updates**: Adjust k value and see immediate results
- **Responsive design**: Works on desktop and mobile devices

### Data Visualizations
- Elbow curve (WCSS vs k)
- Cluster scatter plot with color-coded groups
- Actual vs Predicted profit scatter plot
- Statistical summary cards

### Business Intelligence
Each cluster includes:
- Product count
- Average price, units sold, profit
- Promotion frequency
- Actionable business recommendations

## 🧪 Testing

To test with your own data, ensure your CSV has these columns:
```
product_id, product_name, category, price, cost, units_sold, 
promotion_frequency, shelf_level, profit
```

## 📝 Assignment Context

This project was developed as part of a Machine Learning course assignment focusing on:
- Understanding and implementing ML algorithms from scratch
- Proper data preprocessing techniques
- Model comparison and evaluation
- Clear visualization and communication of results
- User-centric design for non-technical audiences

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Your Name**
- GitHub: [@wicsfl](https://github.com/wicsfl)

## 🙏 Acknowledgments

- Assignment designed for Machine Learning course
- Built with guidance from AI tools (Claude, ChatGPT)
- Recharts for visualization components
- React community for excellent documentation

## 📧 Contact

For questions or feedback, please open an issue or contact [jflor187@fiu.edu]

---

⭐ If you found this project helpful, please give it a star!
