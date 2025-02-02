import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ArticleDetailsScreen({ route }) {
  const { article } = route.params;

  return (
    <View style={styles.container}>
      <WebView source={{ uri: article.url }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
