import React, { Component } from "react";
import { View, StyleSheet, PanResponder, Dimensions } from "react-native";
import SvgUri from "./src/modified_nodes/react-native-svg-uri";
import SvgPanZoom, { SvgPanZoomElement } from "./src/modified_nodes/react-native-svg-pan-zoom";

// const { width, height } = Dimensions.get("window");

const canvasHeight = 600;
const canvasWidth = 301;

export default class App extends Component {
  render() {
    return (
      <View style={{ width: "100%", height: "100%" }}>
        <SvgPanZoom
          canvasHeight={canvasHeight}
          canvasWidth={canvasWidth}
          minScale={0.3}
          maxScale={3}
          initialZoom={0.5}
          canvasStyle={{ backgroundColor: "yellow" }}
          viewStyle={{ backgroundColor: "green" }}
        >
          <SvgUri
          width={canvasWidth}
          height={canvasHeight}
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
