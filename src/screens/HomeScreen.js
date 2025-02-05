import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  StyleSheet, 
  Alert,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';

const API_KEY = 'x'; 
const CURRENTS_API_URL = `https://api.currentsapi.services/v1/latest-news?apiKey=${API_KEY}`;

export default function HomeScreen({ navigation }) {
  const { dark } = useTheme();

  const containerBackground = dark ? '#121212' : '#f5f5f5';
  const cardBackground = dark ? '#1e1e1e' : '#fff';
  const titleColor = dark ? '#fff' : '#333';
  const descriptionColor = dark ? '#ccc' : '#666';
  const sourceColor = dark ? '#aaa' : '#999';

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedArticles, setSavedArticles] = useState([]);
  const [page, setPage] = useState(1);

  const saveArticle = async (article) => {
    try {
      const saved = await AsyncStorage.getItem('savedArticles');
      const savedArray = saved ? JSON.parse(saved) : [];
      const articleExists = savedArray.some(
        (savedArticle) => savedArticle.title === article.title
      );

      if (!articleExists) {
        savedArray.push(article);
        await AsyncStorage.setItem('savedArticles', JSON.stringify(savedArray));
      }
      setSavedArticles(savedArray);
    } catch (error) {
      console.error("Error saving article:", error);
    }
  };

  const fetchNews = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`${CURRENTS_API_URL}&page=${pageNumber}`);
      const data = await response.json();
      if (data.news.length === 0) {
        Alert.alert("No Articles", "No more articles available.");
      } else {
        setArticles(prevArticles => [...prevArticles, ...data.news]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setArticles([]);
    await fetchNews(1);
    setRefreshing(false);
  };

  const loadMoreArticles = () => {
    if (!loading) {
      setPage(prevPage => {
        const newPage = prevPage + 1;
        fetchNews(newPage);
        return newPage;
      });
    }
  };

  useEffect(() => {
    fetchNews(page);
  }, [page]);

  const isSaved = (article) => {
    return savedArticles.some(
      (savedArticle) => savedArticle.title === article.title
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      <Text style={[styles.title, { color: titleColor }]}>Latest News</Text>

      {loading && page === 1 ? (
        <ActivityIndicator size="large" color="#41a3ff" />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={[styles.articleCard, { backgroundColor: cardBackground }]}>
              <TouchableOpacity
                style={styles.articleContent}
                onPress={() =>
                  navigation.navigate('ArticleDetails', { article: item })
                }
              >
                <Image
                  style={styles.articleImage}
                  source={
                    item.image
                      ? { uri: item.image }
                      : require('./assets/placeholder.png') 
                  }
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.articleTitle, { color: titleColor }]}>
                    {item.title}
                  </Text>
                  <Text 
                    style={[styles.articleDescription, { color: descriptionColor }]} 
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                  <View style={styles.separator}></View>
                  <Text style={[styles.articleSource, { color: sourceColor }]}>
                    Source: {item.author || 'Unknown Source'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => saveArticle(item)} style={styles.saveButton}>
                <Ionicons 
                  name={isSaved(item) ? "checkmark-outline" : "bookmark-outline"} 
                  size={24} 
                  color={isSaved(item) ? "green" : "blue"} 
                />
              </TouchableOpacity>
            </View>
          )}
          onEndReached={loadMoreArticles}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  articleCard: {
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
    flexDirection: 'row',
    elevation: 3,
  },
  articleImage: {
    width: 300,
    height: 150,
    borderRadius: 8,
    marginRight: 10,
  },
  articleContent: {
    flex: 1,
    padding: 10,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  articleDescription: {
    fontSize: 14,
  },
  saveButton: {
    padding: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  articleSource: {
    fontSize: 12,
    marginTop: 5,
  },
});
