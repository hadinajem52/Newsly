import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Alert, 
  RefreshControl 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useTheme } from '@react-navigation/native';

export default function SavedArticlesScreen({ navigation }) {
  const { dark } = useTheme();

  // Define dynamic colors based on the theme
  const containerBackground = dark ? '#121212' : '#f5f5f5';
  const titleColor = dark ? '#fff' : '#333';
  const textColor = dark ? '#ccc' : '#666';
  const cardBackground = dark ? '#1e1e1e' : '#fff';
  const noArticlesTextColor = dark ? '#aaa' : '#777';

  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch saved articles from AsyncStorage
  const fetchSavedArticles = async () => {
    setLoading(true);
    try {
      const saved = await AsyncStorage.getItem('savedArticles');
      setSavedArticles(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error("Error fetching saved articles:", error);
      Alert.alert("Error", "Could not load saved articles.");
    }
    setLoading(false);
  };

  // Refresh function for pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedArticles();
    setRefreshing(false);
  };

  // Auto-refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchSavedArticles();
    }, [])
  );

  // Remove article from saved list
  const removeArticle = async (title) => {
    if (!title) return;
    try {
      setSavedArticles((prevArticles) => {
        const updatedArticles = prevArticles.filter(
          article => article.title && article.title !== title
        );
        AsyncStorage.setItem('savedArticles', JSON.stringify(updatedArticles));
        return updatedArticles;
      });
    } catch (error) {
      console.error("Error deleting article:", error);
      Alert.alert("Error", "Could not remove article.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBackground }]}>
      <Text style={[styles.title, { color: titleColor }]}>Saved Articles</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#41a3ff" />
      ) : savedArticles.length === 0 ? (
        <Text style={[styles.noArticlesText, { color: noArticlesTextColor }]}>
          No saved articles.
        </Text>
      ) : (
        <FlatList
          data={savedArticles}
          keyExtractor={(item, index) => index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <View style={[styles.articleCard, { backgroundColor: cardBackground }]}>
              <TouchableOpacity
                style={styles.articleContent}
                onPress={() => navigation.navigate('ArticleDetails', { article: item })}
              >
                <Image 
                  source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
                  style={styles.articleImage} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.articleTitle, { color: titleColor }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.articleDescription, { color: textColor }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => removeArticle(item.title)} style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}
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
  noArticlesText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  articleCard: {
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    elevation: 3,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  articleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  articleDescription: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
  },
});
