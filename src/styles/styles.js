// src/styles/styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryCard: {
    width: '40%', // Adjust for better spacing
    backgroundColor: '#fff',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3, // Shadow effect
  },
  selectedCard: {
    backgroundColor: '#41a3ff',
  },
  categoryText: {
    fontSize: 16,
    marginTop: 5,
    color: '#333',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#41a3ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '90%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
