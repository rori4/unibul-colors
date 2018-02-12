import React, { Component } from "react";
import { View, StyleSheet, PanResponder, Dimensions } from "react-native";
import SvgUri from "react-native-svg-uri";
import SvgPanZoom, { SvgPanZoomElement } from "react-native-svg-pan-zoom";

// const { width, height } = Dimensions.get("window");

const height = 500;
const width = 500;

export default class App extends Component {
  render() {
    return (
      <View style={{ width: "100%", height: "100%" }}>
        <SvgPanZoom
          canvasHeight={height}
          canvasWidth={width}
          minScale={0.5}
          initialZoom={0.7}
          canvasStyle={{ backgroundColor: "yellow" }}
          viewStyle={{ backgroundColor: "green" }}
        >
          <SvgUri
          width={width}
          height={height}
            source={{
              uri:
                "http://thenewcode.com/assets/images/thumbnails/homer-simpson.svg"
            }}
          />
          {/* Responds to clicks */}
        </SvgPanZoom>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ecf0f1"
  }
});
