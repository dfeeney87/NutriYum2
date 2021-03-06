import React, { Component } from 'react'
import { Image } from 'react-native'
import {
  Picker,
  Button,
  Container,
  Icon,
  Header,
  Content,
  Text,
  Card,
  CardItem,
  Body,
  Left,
  Right,
  List,
  ListItem,
  Form,
  Separator,
  View
} from 'native-base'
import { RNS3 } from 'react-native-aws3'
// import {
//   AMAZON_ACCESSKEY,
//   AMAZON_SECRETKEY,
//   WATSON_KEY
// } from 'react-native-dotenv'
import axios from 'axios'
import styles from '../../Styles'
import FoodLog from './FoodLog'

let accesskey = 'AKIAJGELABLCI4QXHX5A'
let secretkey = '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'
let watsonKey = 'b9f2f8bb3e2e8a67a0456ba3f816c09b1ba963e6'

const options = {
  // keyPrefix: "uploads/",
  bucket: 'nutriyum',
  region: 'us-east-1',
  accessKey: accesskey,
  secretKey: secretkey,
  successActionStatus: 201
}

class MyFoodScreen extends React.Component {
  constructor(props) {
    super(props)
  }
  static navigationOptions = {
    tabBarLabel: 'Food'
  }
  state = {
    bucketLocale: '',
    watsonFood: [],
    watsonPicker: '',
    nutrition: {},
    photo: ''
  }

  clearFoodState() {
    this.setState({
      bucketLocale: '',
      watsonFood: [],
      watsonPicker: '',
      nutrition: {}
    })
  }

  send = async (photo, photoName) => {
    const file = {
      uri: photo,
      name: photoName,
      type: 'image/png'
    }
    if (!this.state.bucketLocale) {
      await RNS3.put(file, options).then(response => {
        if (response.status !== 201)
          throw new Error('Failed to upload image to S3')
        this.setState({
          bucketLocale: response.body.postResponse.location
        })
        console.log('from amazon', this.state.bucketLocale)
      })
      const response = await axios.get(
        `https://gateway-a.watsonplatform.net/visual-recognition/api/v3/classify?api_key=${watsonKey}&url=${
          this.state.bucketLocale
        }&version=2018-03-19&classifier_ids=food`
      )
      let result = response.data.images[0].classifiers[0].classes
      await this.setState({ watsonFood: result })
      console.log('from watson', this.state)
      this.setState({ bucketLocale: '', watsonPicker: '', nutrition: {} })
    }
  }

  render() {
    const { navigation } = this.props
    let newPhoto = navigation.getParam('photo')
    let newPhotoName = navigation.getParam('photoName')
    return (
      <Container>
        <Header />
        <Content>
          {newPhoto ? (
            <Card>
              <CardItem>
                <Body>
                  <Text>My Pic</Text>
                </Body>
              </CardItem>
              <CardItem cardBody>
                <Image
                  style={{ flex: 1, height: 200, width: null }}
                  source={{ uri: newPhoto }}
                />
              </CardItem>
              <CardItem>
                <Left>
                  <Button
                    transparent
                    onPress={() => this.send(newPhoto, newPhotoName)}
                  >
                    <Icon active name="thumbs-up" />
                    <Text>Send to Watson</Text>
                  </Button>
                </Left>
              </CardItem>
            </Card>
          ) : (
            <FoodLog />
          )}
          {this.state.watsonFood.length > 0 ? (
            <View>
              <Form>
                <Picker
                  mode="dropdown"
                  selectedValue={this.state.watsonPicker}
                  onValueChange={async itemValue => {
                    try {
                      await this.setState({ watsonPicker: itemValue })
                      if (itemValue !== 'non-food') {
                        let result = await axios.get(
                          `https://nutri-yum.herokuapp.com/api/nutri/${
                            this.state.watsonPicker
                          }`
                        )
                        this.setState({ nutrition: result.data })
                      }
                    } catch (error) {
                      console.error(error)
                      return <Text>{error.message}</Text>
                    }
                  }}
                >
                  {this.state.watsonFood.map((item, index) => {
                    return (
                      <Picker.Item
                        style={styles.pickerListText}
                        key={index}
                        label={`Food ${item.class}  ||  Likelihood ${
                          item.score
                        }`}
                        value={item.class}
                      />
                    )
                  })}
                </Picker>
              </Form>

              <List>
                {Object.keys(this.state.nutrition).map((item, index) => {
                  return (
                    <ListItem style={styles.centerItems} key={index}>
                      <Text style={styles.foodListText}>
                        {item} : {this.state.nutrition[item]}
                      </Text>
                    </ListItem>
                  )
                })}
              </List>
            </View>
          ) : null}
          {Object.keys(this.state.nutrition).length ? (
            <Button
              onPress={() => {
                console.log(this.state.nutrition)
                return (
                  <FoodLog
                    navigation={this.props.navigation}
                    foodName={this.state.nutrition.name}
                    photo={newPhoto}
                    clearFood={this.clearFoodState}
                  />
                )
              }}
            >
              <Text>Add to Daily Food Log</Text>
            </Button>
          ) : null}
        </Content>
      </Container>
    )
  }
}

export default MyFoodScreen


// export default connect(null, null)(MyFoodScreen);

