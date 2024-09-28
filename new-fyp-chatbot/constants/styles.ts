import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  screen: {
    marginHorizontal: '1%',
    paddingHorizontal: 20, // Adjust as per your layout needs
    flexShrink: 1, // Add flexShrink to reduce height if needed
    marginTop: '5%',
  },
  rowLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    paddingHorizontal: 10,
    flex: 1,
    justifyContent: 'center',
  },
  bigTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  smallTitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    opacity: 0.6,
  },
  imageContainer: {
    height: 50,
    width: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    marginTop: 20,
    padding: 30,
    resizeMode: 'contain',
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  bannerContainer: {
    flex: 1,
  },
  fireImage: {
    height: 15,
    width: 15,
    alignSelf: 'center',
    margin: 5,
  },
  offer: {
    color: 'white',
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
  },
  offerText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  model: {
    position: 'absolute',
    right: 20,
    bottom: 0,
    zIndex: 10,
    height: '50%',
    width: '50%',
    transform: [{ rotateY: '180deg' }],
  },
  label: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    marginVertical: 10,
  },
  bottomTabContainer: {
    position: 'absolute',
    bottom: 10,
    margin: 10,
    marginHorizontal: 25,
    borderRadius: 20,
    padding: 10,
    backgroundColor: '#EDEDED',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomButton: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
  },
  bottomButtonImage: {
    height: 20,
    width: 20,
  },
  bottomButtonPlus: {
    position: 'absolute',
    left: '43%',
    top: -25,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  bottomButtonActiveIndicator: {
    width: '10%',
    position: 'absolute',
    height: 2,
    backgroundColor: '#8860a2',
    bottom: 0,
    left: 25,
  },
  cardContainer: {
    flex: 1,
    padding: 10,
    alignSelf: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    borderRadius: 10,
    shadowColor: 'lightgrey',
    shadowOffset: { width: -5, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  progressCircle: {
    shadowColor: 'grey',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  videoPlayContainer: {
    borderRadius: 15,
    marginHorizontal: 12,
    shadowOffset: { width: -5, height: 3 },
    shadowColor: 'grey',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    backgroundColor: '#fff',
  },
  videoPlayBackground: {
    height: 150,
    width: 300,
  },
  videoPlayGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  videoPlayStar: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: 5,
    right: 10,
    top: 10,
    borderRadius: 5,
  },
  videoPlayText: {
    position: 'absolute',
    bottom: 5,
    left: 10,
    fontFamily: 'Poppins-Regular',
    color: '#fff',
  },
  videoPlayDescription: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 15,
  },
  videoPlayDuration: {
    position: 'absolute',
    backgroundColor: '#8860a2',
    padding: 10,
    right: 25,
    top: -15,
    borderRadius: 15,
    zIndex: 3,
  },
  videoPlayDurationText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#8860a2',
  },
  videoPlayCategoryText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
});

export default styles;
