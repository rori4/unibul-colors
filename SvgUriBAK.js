import React, { Component } from "react";
import { View, StyleSheet, PanResponder, Dimensions } from "react-native";
import PropTypes from "prop-types";
import xmldom from "xmldom";
import resolveAssetSource from "react-native/Libraries/Image/resolveAssetSource";

import Svg, {
  Circle,
  Ellipse,
  G,
  LinearGradient,
  RadialGradient,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
  Text,
  TSpan,
  Defs,
  Stop
} from "react-native-svg";

import * as utils from "./utils";

const ACCEPTED_SVG_ELEMENTS = [
  "svg",
  "g",
  "circle",
  "path",
  "rect",
  "defs",
  "line",
  "linearGradient",
  "radialGradient",
  "stop",
  "ellipse",
  "polygon",
  "polyline",
  "text",
  "tspan"
];

// Attributes from SVG elements that are mapped directly.
const SVG_ATTS = ["viewBox", "width", "height"];
const G_ATTS = ["id"];

const CIRCLE_ATTS = ["cx", "cy", "r"];
const PATH_ATTS = ["d"];
const RECT_ATTS = ["width", "height"];
const LINE_ATTS = ["x1", "y1", "x2", "y2"];
const LINEARG_ATTS = LINE_ATTS.concat(["id", "gradientUnits"]);
const RADIALG_ATTS = CIRCLE_ATTS.concat(["id", "gradientUnits"]);
const STOP_ATTS = ["offset"];
const ELLIPSE_ATTS = ["cx", "cy", "rx", "ry"];

const TEXT_ATTS = ["fontFamily", "fontSize", "fontWeight"];

const POLYGON_ATTS = ["points"];
const POLYLINE_ATTS = ["points"];

const COMMON_ATTS = [
  "fill",
  "fillOpacity",
  "stroke",
  "strokeWidth",
  "strokeOpacity",
  "opacity",
  "strokeLinecap",
  "strokeLinejoin",
  "strokeDasharray",
  "strokeDashoffset",
  "x",
  "y",
  "rotate",
  "scale",
  "origin",
  "originX",
  "originY"
];

/**
 *  Additional Calculations
 * @param {*} x1 
 * @param {*} y1 
 * @param {*} x2 
 * @param {*} y2 
 */
function calcDistance(x1, y1, x2, y2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function middle(p1, p2) {
  return (p1 + p2) / 2;
}

function calcCenter(x1, y1, x2, y2) {
  return {
    x: middle(x1, x2),
    y: middle(y1, y2),
  };
}
// end of calculation functions

let ind = 0;

function fixYPosition(y, node) {
  if (node.attributes) {
    const fontSizeAttr = Object.keys(node.attributes).find(
      a => node.attributes[a].name === "font-size"
    );
    if (fontSizeAttr) {
      return (
        "" + (parseFloat(y) - parseFloat(node.attributes[fontSizeAttr].value))
      );
    }
  }
  if (!node.parentNode) {
    return y;
  }
  return fixYPosition(y, node.parentNode);
}

class SvgUri extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fill: props.fill,
      svgXmlData: props.svgXmlData,
      zoom: 1,
      left: 0,
      top: 0
    };

    this.createSVGElement = this.createSVGElement.bind(this);
    this.obtainComponentAtts = this.obtainComponentAtts.bind(this);
    this.inspectNode = this.inspectNode.bind(this);
    this.fetchSVGData = this.fetchSVGData.bind(this);

    this.isComponentMounted = false;

    // Gets the image data from an URL or a static file
    if (props.source) {
      const source = resolveAssetSource(props.source) || {};
      this.fetchSVGData(source.uri);
    }
  }

  /**
   * From here starts the resize calculations
   *
   * @param {any} x1
   * @param {any} y1
   * @param {any} x2
   * @param {any} y2
   * @memberof SvgUri
   */
  processPinch(x1, y1, x2, y2) {
    const distance = calcDistance(x1, y1, x2, y2);
    const { x, y } = calcCenter(x1, y1, x2, y2);

    if (!this.state.isZooming) {
      const { top, left, zoom } = this.state;
      this.setState({
        isZooming: true,
        initialX: x,
        initialY: y,
        initialTop: top,
        initialLeft: left,
        initialZoom: zoom,
        initialDistance: distance
      });
    } else {
      const {
        initialX,
        initialY,
        initialTop,
        initialLeft,
        initialZoom,
        initialDistance
      } = this.state;

      const touchZoom = distance / initialDistance;
      const dx = x - initialX;
      const dy = y - initialY;

      const left = (initialLeft + dx - x) * touchZoom + x;
      const top = (initialTop + dy - y) * touchZoom + y;
      const zoom = initialZoom * touchZoom;

      this.setState({
        zoom,
        left,
        top
      });
    }
  }

  processTouch(x, y) {
    if (!this.state.isMoving || this.state.isZooming) {
      const { top, left } = this.state;
      this.setState({
        isMoving: true,
        isZooming: false,
        initialLeft: left,
        initialTop: top,
        initialX: x,
        initialY: y
      });
    } else {
      const { initialX, initialY, initialLeft, initialTop } = this.state;
      const dx = x - initialX;
      const dy = y - initialY;
      this.setState({
        left: initialLeft + dx,
        top: initialTop + dy
      });
    }
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onPanResponderGrant: () => {},
      onPanResponderTerminate: () => {},
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponder: () => true,
      onShouldBlockNativeResponder: () => true,
      onPanResponderTerminationRequest: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onPanResponderMove: evt => {
        const touches = evt.nativeEvent.touches;
        const length = touches.length;
        if (length === 1) {
          const [{ locationX, locationY }] = touches;
          this.processTouch(locationX, locationY);
        } else if (length === 2) {
          const [touch1, touch2] = touches;
          this.processPinch(
            touch1.locationX,
            touch1.locationY,
            touch2.locationX,
            touch2.locationY
          );
        }
      },
      onPanResponderRelease: () => {
        this.setState({
          isZooming: false,
          isMoving: false
        });
      }
    });
    this.isComponentMounted = true;
  }
  // End of resize calculations

  componentWillReceiveProps(nextProps) {
    if (nextProps.source) {
      const source = resolveAssetSource(nextProps.source) || {};
      const oldSource = resolveAssetSource(this.props.source) || {};
      if (source.uri !== oldSource.uri) {
        this.fetchSVGData(source.uri);
      }
    }

    if (nextProps.svgXmlData !== this.props.svgXmlData) {
      this.setState({ svgXmlData: nextProps.svgXmlData });
    }

    if (nextProps.fill !== this.props.fill) {
      this.setState({ fill: nextProps.fill });
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
  }

  async fetchSVGData(uri) {
    let responseXML = null;
    try {
      const response = await fetch(uri);
      responseXML = await response.text();
    } catch (e) {
      console.error("ERROR SVG", e);
    } finally {
      if (this.isComponentMounted) {
        this.setState({ svgXmlData: responseXML });
      }
    }

    return responseXML;
  }

  // Remove empty strings from children array
  trimElementChilden(children) {
    for (child of children) {
      if (typeof child === "string") {
        if (child.trim.length === 0)
          children.splice(children.indexOf(child), 1);
      }
    }
  }

  createSVGElement(node, childs) {
    this.trimElementChilden(childs);
    let componentAtts = {};
    const i = ind++;
    const viewBoxSize = 65;
    const { height, width } = this.props;
    const { left, top, zoom } = this.state;
    const resolution = viewBoxSize / Math.min(height, width);
    switch (node.nodeName) {
      case "svg":
        componentAtts = this.obtainComponentAtts(node, SVG_ATTS);
        if (this.props.width) {
          componentAtts.width = this.props.width;
        }
        if (this.props.height) {
          componentAtts.height = this.props.height;
        }

        return (
          <Svg
            width={width}
            height={height}
            viewBox="0 0 65 65"
            preserveAspectRatio="xMinYMin meet"
            key={i}
            {...componentAtts}
          >
            {childs}
          </Svg>
        );
      case "g":
        componentAtts = this.obtainComponentAtts(node, G_ATTS);
        return (
          <G
            transform={{
              translateX: left * resolution,
              translateY: top * resolution,
              scale: zoom
            }}
            key={i}
            {...componentAtts}
          >
            {childs}
          </G>
        );
      case "path":
        componentAtts = this.obtainComponentAtts(node, PATH_ATTS);
        return (
          <Path key={i} {...componentAtts}>
            {childs}
          </Path>
        );
      case "circle":
        componentAtts = this.obtainComponentAtts(node, CIRCLE_ATTS);
        return (
          <Circle key={i} {...componentAtts}>
            {childs}
          </Circle>
        );
      case "rect":
        componentAtts = this.obtainComponentAtts(node, RECT_ATTS);
        return (
          <Rect key={i} {...componentAtts}>
            {childs}
          </Rect>
        );
      case "line":
        componentAtts = this.obtainComponentAtts(node, LINE_ATTS);
        return (
          <Line key={i} {...componentAtts}>
            {childs}
          </Line>
        );
      case "defs":
        return <Defs key={i}>{childs}</Defs>;
      case "linearGradient":
        componentAtts = this.obtainComponentAtts(node, LINEARG_ATTS);
        return (
          <LinearGradient key={i} {...componentAtts}>
            {childs}
          </LinearGradient>
        );
      case "radialGradient":
        componentAtts = this.obtainComponentAtts(node, RADIALG_ATTS);
        return (
          <RadialGradient key={i} {...componentAtts}>
            {childs}
          </RadialGradient>
        );
      case "stop":
        componentAtts = this.obtainComponentAtts(node, STOP_ATTS);
        return (
          <Stop key={i} {...componentAtts}>
            {childs}
          </Stop>
        );
      case "ellipse":
        componentAtts = this.obtainComponentAtts(node, ELLIPSE_ATTS);
        return (
          <Ellipse key={i} {...componentAtts}>
            {childs}
          </Ellipse>
        );
      case "polygon":
        componentAtts = this.obtainComponentAtts(node, POLYGON_ATTS);
        return (
          <Polygon key={i} {...componentAtts}>
            {childs}
          </Polygon>
        );
      case "polyline":
        componentAtts = this.obtainComponentAtts(node, POLYLINE_ATTS);
        return (
          <Polyline key={i} {...componentAtts}>
            {childs}
          </Polyline>
        );
      case "text":
        componentAtts = this.obtainComponentAtts(node, TEXT_ATTS);
        if (componentAtts.y) {
          componentAtts.y = fixYPosition(componentAtts.y, node);
        }
        return (
          <Text key={i} {...componentAtts}>
            {childs}
          </Text>
        );
      case "tspan":
        componentAtts = this.obtainComponentAtts(node, TEXT_ATTS);
        if (componentAtts.y) {
          componentAtts.y = fixYPosition(componentAtts.y, node);
        }
        return (
          <TSpan key={i} {...componentAtts}>
            {childs}
          </TSpan>
        );
      default:
        return null;
    }
  }

  obtainComponentAtts({ attributes }, enabledAttributes) {
    const styleAtts = {};
    Array.from(attributes).forEach(({ nodeName, nodeValue }) => {
      Object.assign(
        styleAtts,
        utils.transformStyle({
          nodeName,
          nodeValue,
          fillProp: this.state.fill
        })
      );
    });

    const componentAtts = Array.from(attributes)
      .map(utils.camelCaseNodeName)
      .map(utils.removePixelsFromNodeValue)
      .filter(utils.getEnabledAttributes(enabledAttributes.concat(COMMON_ATTS)))
      .reduce((acc, { nodeName, nodeValue }) => {
        acc[nodeName] =
          this.state.fill && nodeName === "fill" && nodeValue !== "none"
            ? this.state.fill
            : nodeValue;
        return acc;
      }, {});
    Object.assign(componentAtts, styleAtts);

    return componentAtts;
  }

  inspectNode(node) {
    // Only process accepted elements
    if (!ACCEPTED_SVG_ELEMENTS.includes(node.nodeName)) {
      return null;
    }

    // Process the xml node
    const arrayElements = [];

    // if have children process them.
    // Recursive function.
    if (node.childNodes && node.childNodes.length > 0) {
      for (let i = 0; i < node.childNodes.length; i++) {
        const isTextValue = node.childNodes[i].nodeValue;
        if (isTextValue) {
          arrayElements.push(node.childNodes[i].nodeValue);
        } else {
          const nodo = this.inspectNode(node.childNodes[i]);
          if (nodo != null) {
            arrayElements.push(nodo);
          }
        }
      }
    }

    return this.createSVGElement(node, arrayElements);
  }

  render() {
    try {
      if (this.state.svgXmlData == null) {
        return null;
      }

      const inputSVG = this.state.svgXmlData.substring(
        this.state.svgXmlData.indexOf("<svg "),
        this.state.svgXmlData.indexOf("</svg>") + 6
      );

      const doc = new xmldom.DOMParser().parseFromString(inputSVG);

      const rootSVG = this.inspectNode(doc.childNodes[0]);

      return <View {...this._panResponder.panHandlers}>{rootSVG}</View>;
    } catch (e) {
      console.error("ERROR SVG", e);
      return null;
    }
  }
}

SvgUri.propTypes = {
  style: PropTypes.object,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  svgXmlData: PropTypes.string,
  source: PropTypes.any,
  fill: PropTypes.string
};

module.exports = SvgUri;
