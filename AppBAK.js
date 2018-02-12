import React, { Component } from "react";
import { View } from "react-native";
import { Circle } from "react-native-svg";
import SvgPanZoom, { SvgPanZoomElement } from "react-native-svg-pan-zoom";

export default class App extends Component {
  render() {
    return (
      <View style={{ width: "100%", height: "100%" }}>
        <SvgPanZoom
          canvasHeight={500}
          canvasWidth={500}
          minScale={0.5}
          initialZoom={0.7}
          onZoom={zoom => {
            console.log("onZoom:" + zoom);
          }}
          canvasStyle={{
            backgroundColor: "yellow"
          }}
          viewStyle={{ backgroundColor: "green" }}
        >
          {/* Doesn't consume or respond to clicks */}
          <Circle
            cx={100}
            cy={100}
            r={42}
            stroke="red"
            strokeWidth="2.5"
            fill="blue"
          />

          {/* Responds to clicks */}
          <SvgPanZoomElement
            onClick={() => {
              console.log("onClick!");
            }}
            onClickCanceled={() => {
              console.log("onClickCanceled!");
            }}
            onClickRelease={() => {
              console.log("onClickRelease!");
            }}
            onDrag={() => {
              console.log("onDrag!");
            }}
          >
            <Circle
              cx={42}
              cy={42}
              r={42}
              stroke="blue"
              strokeWidth="2.5"
              fill="red"
            />
          </SvgPanZoomElement>
        </SvgPanZoom>
      </View>
    );
  }
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//     alignItems: "center",
//     justifyContent: "center"
//   }
// });


// <SvgUri
// width={width}
// height={height}
// source={{
//   uri:
//     "http://thenewcode.com/assets/images/thumbnails/homer-simpson.svg"
// }}
// />