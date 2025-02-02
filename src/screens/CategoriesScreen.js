import React, { useState, useEffect } from 'react'; 
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  Image,
  Modal,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import Markdown from 'react-native-markdown-display';
import * as Notifications from 'expo-notifications';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useTheme } from '@react-navigation/native';

const CRYPTO_API_URL =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd';

const apiKey = "AIzaSyDQ1s3wjcuSpZe5ETX6Ocx7r27Im3NICcA";
const genAI = new GoogleGenerativeAI(apiKey);

export const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
});

export const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export default function CryptoScreen() {
  const { dark } = useTheme(); 
  console.log("useTheme dark:", dark);

  // State declarations
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [isChartModalVisible, setIsChartModalVisible] = useState(false);
  const [aiInsights, setAIInsights] = useState('');
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Alert states
  const [alerts, setAlerts] = useState([]); 
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [currentAlertCoin, setCurrentAlertCoin] = useState(null);
  const [alertTargetPrice, setAlertTargetPrice] = useState('');

  // Live Transactions states
  const [liveTransactionsModalVisible, setLiveTransactionsModalVisible] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [liveTransactionsCoin, setLiveTransactionsCoin] = useState(null);

  useEffect(() => {
    registerForPushNotificationsAsync();
    fetchCryptoData();
  }, []);

  // Register for push notifications using expo-notifications
  async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('Error', 'Failed to get push token for notifications!');
      return;
    }
  }

  // Send a local notification immediately
  async function sendLocalNotification(title, body) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  }

  // Fetch crypto data from CoinGecko
  const fetchCryptoData = async () => {
    setLoading(true);
    try {
      const response = await fetch(CRYPTO_API_URL);
      const data = await response.json();
      setCryptoData(data);
      checkAlerts(data, alerts);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      Alert.alert(
        'Error',
        'Unable to fetch cryptocurrency data. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCryptoData().finally(() => setRefreshing(false));
  };

  const getTradingViewScript = (cryptoSymbol) => {
    const formattedSymbol = `BINANCE:${cryptoSymbol.toUpperCase()}USDT`;
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

  const openCryptoChart = (cryptoId) => {
    const selected = cryptoData.find((item) => item.id === cryptoId);
    setSelectedCrypto(selected);
    setIsChartModalVisible(true);
  };

  const openLiveTransactions = (coin) => {
    setLiveTransactionsCoin(coin);
    setLiveTransactions([]); 
    setLiveTransactionsModalVisible(true);
  };

  useEffect(() => {
    let ws;
    if (liveTransactionsModalVisible && liveTransactionsCoin) {
      const symbol = `${liveTransactionsCoin.symbol.toLowerCase()}usdt`;
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@trade`);
      ws.onmessage = (event) => {
        const tradeData = JSON.parse(event.data);
        const price = parseFloat(tradeData.p).toFixed(6);
        const quantity = parseFloat(tradeData.q).toFixed(6);
        const value = (parseFloat(tradeData.p) * parseFloat(tradeData.q)).toFixed(6);
        const time = new Date(tradeData.T).toLocaleTimeString();
        const side = tradeData.m ? 'sell' : 'buy';
        setLiveTransactions(prev => [
          { id: tradeData.t, price, quantity, value, time, side },
          ...prev.slice(0, 30)
        ]);
      };
    }
    return () => {
      if (ws) ws.close();
    };
  }, [liveTransactionsModalVisible, liveTransactionsCoin]);

  // Gemini AI Insights
  const fetchAIInsights = async (crypto) => {
    setLoadingInsights(true);
    setInsightsModalVisible(true);
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${crypto.id}`
      );
      const [latestData] = response.data;
      if (!latestData) throw new Error("No data returned for coin");

      const prompt = `
## Detailed and Creative Analysis on ${latestData.name} (${latestData.symbol.toUpperCase()})

**Current Price:** $${latestData.current_price.toFixed(6)}
**24h Change:** ${latestData.price_change_percentage_24h.toFixed(2)}%
**Market Cap:** $${latestData.market_cap.toLocaleString()}
**Volume:** $${latestData.total_volume.toLocaleString()}

Please provide:

1. **An Up-to-Date Market Overview:** Describe recent price movements, trading volume, and any news or factors impacting ${latestData.name}.
2. **Innovative Insights:** Offer creative ideas or hypotheses on why the market might move in a particular direction.
3. **Risks and Opportunities:** Detail potential risks and opportunities for investors, including any emerging trends.
4. **A Brief Conclusion:** Summarize the key takeaways.
      `;

      const chatSession = model.startChat({
        generationConfig,
        history: [
          { role: "user", parts: [{ text: prompt }] }
        ],
      });

      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text();
      setAIInsights(responseText);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      setAIInsights("Failed to retrieve insights. Try again later.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const checkAlerts = (cryptoData, alerts) => {
    alerts.forEach((alertItem) => {
      const coin = cryptoData.find((c) => c.id === alertItem.coinId);
      if (coin && coin.current_price <= alertItem.targetPrice) {
        sendLocalNotification(
          `${coin.name} Alert`,
          `${coin.name} has fallen below $${alertItem.targetPrice}`
        );
      }
    });
  };

  const openAlertModal = (coin) => {
    setCurrentAlertCoin(coin);
    setAlertTargetPrice('');
    setAlertModalVisible(true);
  };

  const handleSetAlert = () => {
    if (!alertTargetPrice) {
      Alert.alert('Error', 'Please enter a valid target price.');
      return;
    }
    const newAlert = {
      coinId: currentAlertCoin.id,
      targetPrice: parseFloat(alertTargetPrice)
    };
    setAlerts((prev) => [...prev, newAlert]);
    setAlertModalVisible(false);
    Alert.alert('Success', `Alert set for ${currentAlertCoin.name} at $${alertTargetPrice}`);
  };

  const filteredData = cryptoData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const backgroundColor = dark ? '#121212' : '#f5f5f5';
  const modalBackground = dark ? '#1e1e1e' : '#fff';
  const primaryTextColor = dark ? '#fff' : '#000';
  const secondaryTextColor = dark ? '#ccc' : '#333';
  const inputBackgroundColor = dark ? '#333' : '#fff';
  const inputBorderColor = dark ? '#555' : '#ccc';

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: primaryTextColor }]}>
        Cryptocurrency Prices
      </Text>
     

      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: inputBackgroundColor,
              borderColor: inputBorderColor,
              color: primaryTextColor,
            }
          ]}
          placeholder="Search coin..."
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
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const changeColor =
              item.price_change_percentage_24h < 0 ? '#ff3b30' : '#4caf50';
            return (
              <View style={[styles.item, { backgroundColor: modalBackground }]}>
                <View style={styles.alertIconContainer}>
                  <TouchableOpacity onPress={() => openAlertModal(item)}>
                    <Ionicons name="alarm-outline" size={20} color={primaryTextColor} />
                  </TouchableOpacity>
                </View>
                <View style={styles.coinContainer}>
                  <Image source={{ uri: item.image }} style={styles.coinImage} />
                  <Text style={[styles.name, { color: primaryTextColor }]}>
                    {item.name} ({item.symbol.toUpperCase()})
                  </Text>
                </View>
                <Text style={[styles.price, { color: secondaryTextColor }]}>
                  {item.current_price
                    ? `$${new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 6,
                        maximumFractionDigits: 6
                      }).format(item.current_price)}`
                    : 'N/A'}
                </Text>
                <Text style={[styles.change, { color: changeColor }]}>
                  24h Change:{' '}
                  {item.price_change_percentage_24h
                    ? item.price_change_percentage_24h.toFixed(2)
                    : 'N/A'}
                  %
                </Text>

                <View style={styles.buttonsRow}>
                  <TouchableOpacity
                    style={styles.chartButton}
                    onPress={() => openCryptoChart(item.id)}
                  >
                    <Ionicons name="bar-chart" size={20} color="#fff" />
                    <Text style={styles.chartButtonText}>Show Chart</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.insightsButton}
                    onPress={() => fetchAIInsights(item)}
                  >
                    <Ionicons name="bulb-outline" size={20} color="#fff" />
                    <Text style={styles.chartButtonText}>AI Insights</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.liveTransactionsButton}
                    onPress={() => openLiveTransactions(item)}
                  >
                    <Ionicons name="flash-outline" size={20} color="#fff" />
                    <Text style={styles.chartButtonText}>Live Tx</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal
        visible={isChartModalVisible}
        animationType="slide"
        onRequestClose={() => setIsChartModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsChartModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="red" />
          </TouchableOpacity>
          {selectedCrypto ? (
            <WebView
              source={{
                html: getTradingViewScript(selectedCrypto.symbol.toUpperCase())
              }}
              style={{ flex: 1 }}
            />
          ) : (
            <ActivityIndicator size="large" color="#0000ff" />
          )}
        </View>
      </Modal>

      <Modal
        visible={insightsModalVisible}
        animationType="slide"
        onRequestClose={() => setInsightsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setInsightsModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="red" />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: primaryTextColor }]}>
            AI Insights
          </Text>
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
        </View>
      </Modal>

      <Modal
        visible={alertModalVisible}
        animationType="slide"
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setAlertModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="red" />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: primaryTextColor }]}>
            Set Alert for {currentAlertCoin ? currentAlertCoin.name : ''}
          </Text>
          <Text style={[styles.label, { color: primaryTextColor }]}>
            Enter target price:
          </Text>
          <TextInput
            style={[
              styles.alertInput,
              {
                backgroundColor: inputBackgroundColor,
                borderColor: inputBorderColor,
                color: primaryTextColor,
              }
            ]}
            placeholder="e.g., 25000"
            placeholderTextColor={dark ? '#aaa' : '#888'}
            keyboardType="numeric"
            value={alertTargetPrice}
            onChangeText={setAlertTargetPrice}
          />
          <View style={styles.alertButtonsRow}>
            <TouchableOpacity style={styles.setAlertButton} onPress={handleSetAlert}>
              <Text style={styles.setAlertButtonText}>Set Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelAlertButton}
              onPress={() => setAlertModalVisible(false)}
            >
              <Text style={styles.cancelAlertButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={liveTransactionsModalVisible}
        animationType="slide"
        onRequestClose={() => setLiveTransactionsModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: modalBackground }]}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setLiveTransactionsModalVisible(false)}
          >
            <Ionicons name="close" size={30} color="red" />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: primaryTextColor }]}>
            Live Transactions for {liveTransactionsCoin ? liveTransactionsCoin.name : ''}
          </Text>
          
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.columnTime, { color: primaryTextColor }]}>Time</Text>
            <Text style={[styles.tableHeaderText, styles.columnPrice, { color: primaryTextColor }]}>Price</Text>
            <Text style={[styles.tableHeaderText, styles.columnSide, { color: primaryTextColor }]}>Side</Text>
            <Text style={[styles.tableHeaderText, styles.columnQuantity, { color: primaryTextColor }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.columnValue, { color: primaryTextColor }]}>Value</Text>
          </View>
          
          {/* Table Rows */}
          <FlatList
            data={liveTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.columnTime, { color: primaryTextColor }]}>{item.time}</Text>
                <Text style={[styles.tableCell, styles.columnPrice, { color: primaryTextColor }]}>${item.price}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    styles.columnSide,
                    { color: item.side === 'buy' ? 'green' : 'red' }
                  ]}
                >
                  {item.side.toUpperCase()}
                </Text>
                <Text style={[styles.tableCell, styles.columnQuantity, { color: primaryTextColor }]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.columnValue, { color: primaryTextColor }]}>${item.value}</Text>
              </View>
            )}
            contentContainerStyle={styles.tableContent}
          />
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
    alignItems: 'center'
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
    alignItems: 'center'
  },
  item: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
    position: 'relative'
  },
  alertIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    borderRadius: 15,
    zIndex: 1
  },
  coinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  coinImage: { width: 30, height: 30, marginRight: 10 },
  name: { fontSize: 18, fontWeight: '600' },
  price: { fontSize: 16 },
  change: { fontSize: 14 },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  chartButton: {
    backgroundColor: '#41a3ff',
    padding: 10,
    borderRadius: 5,
    flex: 0.32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  insightsButton: {
    backgroundColor: '#9b69ff',
    padding: 10,
    borderRadius: 5,
    flex: 0.32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  liveTransactionsButton: {
    backgroundColor: '#FF9500',
    padding: 10,
    borderRadius: 5,
    flex: 0.32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
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
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  alertInput: {
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 15,
  },
  alertButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  setAlertButton: {
    backgroundColor: '#41a3ff',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center'
  },
  setAlertButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelAlertButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    flex: 0.48,
    alignItems: 'center'
  },
  cancelAlertButtonText: {
    color: '#333',
    fontSize: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
    marginBottom: 10,
  },
  tableHeaderText: {
    fontWeight: '700',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tableCell: {
    fontSize: 12,
  },
  tableContent: {
    paddingBottom: 20,
  },
  columnTime: {
    flex: 1.2,
    textAlign: 'center',
  },
  columnPrice: {
    flex: 1.2,
    textAlign: 'right',
  },
  columnSide: {
    flex: 0.8,
    textAlign: 'center',
  },
  columnQuantity: {
    flex: 1,
    textAlign: 'right',
  },
  columnValue: {
    flex: 1.2,
    textAlign: 'right',
  },
});
