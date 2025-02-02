import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Button,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Markdown from 'react-native-markdown-display';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useTheme } from '@react-navigation/native';

// Static list of top 10 stocks (including NVIDIA)
const topStocks = [ 
  {
    name: 'NVIDIA Corporation',
    symbol: 'NVDA',
    exchange: 'NASDAQ',
    type: 'Common Stock',
    price: 600.0,
    image: 'https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-grn-500x200-4c25-p@2x.png',
  },
  {
    name: 'Apple Inc.',
    symbol: 'AAPL',
    exchange: 'NASDAQ',
    type: 'Common Stock',
    price: 150.0,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQuOuCMjRB6RWbXLspgUyo32g6v_GZ74Bb_Zg&s',
  },
  {
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    exchange: 'NASDAQ',
    type: 'Common Stock',
    price: 300.0,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQ9Nzs4SiiuIppGOTKQM9uscOBmfVg42rYTA&s',
  },
  {
    name: 'Amazon.com Inc.',
    symbol: 'AMZN',
    exchange: 'NASDAQ',
    type: 'Common Stock',
    price: 3300.0,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRc0L9pU1IjqhK0u8GC0kQBXDB2sj_nd4UDVQ&s',
  },
  {
    name: 'Alphabet Inc.',
    symbol: 'GOOGL',
    exchange: 'NASDAQ',
    type: 'Common Stock',
    price: 2800.0,
    image: 'https://logos-world.net/wp-content/uploads/2022/05/Alphabet-Emblem.png',
  },
  {
    name: 'Meta Platforms, Inc.',
    symbol: 'META',
    exchange: 'NASDAQ',
    type: 'Common Stock',
    price: 200.0,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQb5gAwN9hYWdmJaV5B2BUhS8_ZH10ZkVczkw&s',
  },
  {
    name: 'Tesla, Inc.',
    symbol: 'TSLA',
    exchange: 'NASDAQ',
    type: 'Common Stock',
    price: 900.0,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Tesla_logo.png/640px-Tesla_logo.png',
  },
 
  {
    name: 'Berkshire Hathaway Inc.',
    symbol: 'BRK.B',
    exchange: 'NYSE',
    type: 'Common Stock',
    price: 280.0,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6FuwQwwgmWTBJKP2PjYdRQKTFzioTMJt3_Q&s',
  },
  {
    name: 'JPMorgan Chase & Co.',
    symbol: 'JPM',
    exchange: 'NYSE',
    type: 'Common Stock',
    price: 140.0,
    image: 'https://logoeps.com/wp-content/uploads/2013/02/jpmorgan-vector-logo.png',
  },
  {
    name: 'Visa Inc.',
    symbol: 'V',
    exchange: 'NYSE',
    type: 'Common Stock',
    price: 220.0,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRM59k7Abl4cy6rblPLwmuhdRY_mdW5jiE7tQ&s',
  },
];

// Set up Google Generative AI (make sure you have valid credentials)
const apiKey = 'AIzaSyDQ1s3wjcuSpZe5ETX6Ocx7r27Im3NICcA';
const genAI = new GoogleGenerativeAI(apiKey);
export const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
export const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

export default function StocksScreen() {
  const { dark } = useTheme();

  // State declarations
  const [stocksData, setStocksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [aiInsights, setAIInsights] = useState('');
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Instead of fetching from an API, we load the static topStocks data
    setStocksData(topStocks);
    setLoading(false);
  }, []);

  // Returns the TradingView chart widget HTML string for a stock.
  const getTradingViewScript = (stock) => {
    const prefix = stock.exchange || 'NASDAQ';
    const formattedSymbol = `${prefix}:${stock.symbol.toUpperCase()}`;
    return `
      <html>
        <body style="margin: 0; padding: 0;">
          <div class="tradingview-widget-container" style="height: 100%; width: 100%;">
            <div class="tradingview-widget-container__widget" style="height: 100%; width: 100%;"></div>
            <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js">
              {
                "autosize": true,
                "symbol": "${formattedSymbol}",
                "interval": "D",
                "timezone": "Etc/UTC",
                "theme": "dark",
                "style": "1",
                "locale": "en",
                "allow_symbol_change": true,
                "calendar": false,
                "support_host": "https://www.tradingview.com"
              }
            </script>
          </div>
        </body>
      </html>
    `;
  };

  const openStockChart = (stockSymbol) => {
    const selected = stocksData.find((item) => item.symbol === stockSymbol);
    setSelectedStock(selected);
    setIsChartModalVisible(true);
  };

  // Fetch AI insights about a stock using Gemini AI
  const fetchAIInsights = async (stock) => {
    setLoadingInsights(true);
    setInsightsModalVisible(true);
    try {
      if (!stock) throw new Error('No data available for the selected stock.');

      const prompt = `
## Detailed and Creative Analysis on ${stock.name} (${stock.symbol})

**Current Price:** $${parseFloat(stock.price).toFixed(2)}
**Exchange:** ${stock.exchange}
**Type:** ${stock.type}

Please provide:

1. **An Up-to-Date Market Overview:** Describe recent price movements and any news or factors impacting ${stock.name}.
2. **Innovative Insights:** Offer creative ideas or hypotheses on why the market might move in a particular direction.
3. **Risks and Opportunities:** Detail potential risks and opportunities for investors.
4. **A Brief Conclusion:** Summarize the key takeaways.
      `;
      const chatSession = model.startChat({
        generationConfig,
        history: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text();
      setAIInsights(responseText);
    } catch (error) {
      console.error('Error fetching AI insights:', error);
      setAIInsights('Failed to retrieve insights. Try again later.');
    } finally {
      setLoadingInsights(false);
    }
  };

  // Filter stocks based on the search query (by name or symbol)
  const filteredData = stocksData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic colors based on the theme
  const backgroundColor = dark ? '#121212' : '#f5f5f5';
  const modalBackground = dark ? '#1e1e1e' : '#fff';
  const primaryTextColor = dark ? '#fff' : '#000';
  const secondaryTextColor = dark ? '#ccc' : '#333';
  const inputBackgroundColor = dark ? '#333' : '#fff';
  const inputBorderColor = dark ? '#555' : '#ccc';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: primaryTextColor }]}>Top 10 Stocks</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: inputBackgroundColor, borderColor: inputBorderColor, color: primaryTextColor },
          ]}
          placeholder="Search stock..."
          placeholderTextColor={dark ? '#aaa' : '#888'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={() => {}}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.symbol}
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: modalBackground }]}>
              <View style={styles.stockContainer}>
                <Image source={{ uri: item.image }} style={styles.stockImage} />
                <View>
                  <Text style={[styles.name, { color: primaryTextColor }]}>
                    {item.name} ({item.symbol})
                  </Text>
                  <Text style={[styles.subText, { color: secondaryTextColor }]}>
                    Exchange: {item.exchange} | Type: {item.type}
                  </Text>
                </View>
              </View>
              <Text style={[styles.price, { color: secondaryTextColor }]}>
                {item.price ? `$${parseFloat(item.price).toFixed(2)}` : 'N/A'}
              </Text>
              <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.chartButton} onPress={() => openStockChart(item.symbol)}>
                  <Ionicons name="bar-chart" size={20} color="#fff" />
                  <Text style={styles.chartButtonText}>Show Chart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.insightsButton} onPress={() => fetchAIInsights(item)}>
                  <Ionicons name="bulb-outline" size={20} color="#fff" />
                  <Text style={styles.chartButtonText}>AI Insights</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Chart Modal */}
      <Modal
        visible={isChartModalVisible}
        animationType="slide"
        onRequestClose={() => setIsChartModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
          {selectedStock ? (
            <WebView
              source={{ html: getTradingViewScript(selectedStock) }}
              style={{ flex: 1 }}
            />
          ) : (
            <ActivityIndicator size="large" color="#0000ff" />
          )}
          <Button title="Close" onPress={() => setIsChartModalVisible(false)} />
        </View>
      </Modal>

      {/* AI Insights Modal */}
      <Modal
        visible={insightsModalVisible}
        animationType="slide"
        onRequestClose={() => setInsightsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
          <Text style={[styles.modalTitle, { color: primaryTextColor }]}>AI Insights</Text>
          {loadingInsights ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <ScrollView style={styles.modalContentScroll}>
              <Markdown
                style={{
                  body: { color: primaryTextColor, fontSize: 16, lineHeight: 24 },
                  heading1: { color: primaryTextColor },
                  heading2: { color: primaryTextColor },
                  heading3: { color: primaryTextColor },
                }}
              >
                {aiInsights}
              </Markdown>
            </ScrollView>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => setInsightsModalVisible(false)}>
            <Text style={styles.closeButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  searchButton: {
    backgroundColor: '#41a3ff',
    padding: 10,
    marginLeft: 8,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stockImage: { width: 30, height: 30, marginRight: 10 },
  name: { fontSize: 18, fontWeight: '600' },
  subText: { fontSize: 14, marginTop: 4 },
  price: { fontSize: 16 },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  chartButton: {
    backgroundColor: '#41a3ff',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsButton: {
    backgroundColor: '#9b69ff',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalContentScroll: {
    flex: 1,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#41a3ff',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
