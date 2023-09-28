/* eslint-disable react/jsx-sort-default-props */
import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import classNames from 'classnames';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { scaleLinear } from 'd3-scale';
import L from 'leaflet';
import cloneDeep from 'lodash/cloneDeep';
import SideBarToggleIcon from 'mdi-react/MenuRightIcon';
import PropTypes from 'prop-types';
import {
 MapContainer, ZoomControl, FeatureGroup, Rectangle, ImageOverlay, Circle,
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useToggle } from 'react-use';

import Checkbox from '+components/Checkbox';
import Slider from '+components/Slider';

import Channel from './components/Channel';
import ChannelLabel from './components/ChannelLabel';
import Channels from './components/Channels';
import Container from './components/Container';
import FullscreenControl from './components/FullscreenControl';
import OmeroLayer from './components/OmeroLayer';
import ResetZoomControl from './components/ResetZoomControl';
import SideBar from './components/Sidebar';
import SidebarToggle from './components/SidebarToggle';

const { REACT_APP_BACKEND_URL_ROOT } = process.env;

const baseUrl = `${REACT_APP_BACKEND_URL_ROOT}/omero/webgateway/render_image_region`;

const ImageViewer = (props) => {
  const {
    className,
    image,
    data,
    results,
    value,
    editable,
    onChange,
  } = props;

  const [map, setMap] = useState(null);
  const featureGroupRef = useRef(null);
  const omeroLayerRef = useRef(null);

  const [channels, setChannels] = useState(cloneDeep(data.channels));
  const [sidebarCollapsed, toggleSidebar] = useToggle(true);
  const [rectangleBounds, setRectangleBounds] = useState(null);
  const [centroids, setCentroids] = useState([]);

  const imageLatLngBounds = useMemo(
    () => {
      if (!omeroLayerRef.current || !map?.options?.crs || !data?.size) {
        return;
      }
      const { maxZoom } = omeroLayerRef.current;
      const { width: imageWidth, height: imageHeight } = data.size;
      const p1 = L.point(0, 0);
      const p2 = L.point(imageWidth, imageHeight);
      const latlng1 = map.options.crs.pointToLatLng(p1, maxZoom);
      const latlng2 = map.options.crs.pointToLatLng(p2, maxZoom);
      return L.latLngBounds(latlng1, latlng2);
    },
    [data.size, map],
  );

  const onSidebarMouseEnter = useCallback(
    () => {
      map?.dragging.disable();
    },
    [map],
  );

  const onSidebarMouseLeave = useCallback(
    () => {
      map?.dragging.enable();
    },
    [map],
  );

  const onChannelToggle = useCallback(
    (index) => (_, newValue) => {
      const channelsClone = channels.slice();
      channelsClone[index].active = newValue;
      setChannels(channelsClone);
    },
    [channels],
  );

  const onChannelRangeChange = useCallback(
    (index) => (_, newValue) => {
      const channelsClone = channels.slice();
      channelsClone[index].window.start = newValue[0];
      channelsClone[index].window.end = newValue[1];
      setChannels(channelsClone);
    },
    [channels],
  );

  const onPathChange = useCallback(
    (event) => {
      if (onChange) {
        const { sourceTarget: _map } = event;
        const [ layer ] = featureGroupRef.current.getLayers();
        const [ latLngs ] = layer.getLatLngs();
        const { maxZoom } = omeroLayerRef.current;
        const p1 = _map.options.crs.latLngToPoint(latLngs[1], maxZoom);
        const p2 = _map.options.crs.latLngToPoint(latLngs[3], maxZoom);
        const { width: imageWidth, height: imageHeight } = data.size;
        const region = [{
          x: Math.min(imageWidth, Math.max(0, Math.round(p1.x))),
          y: Math.min(imageHeight, Math.max(0, Math.round(p1.y))),
        }, {
          x: Math.min(imageWidth, Math.max(0, Math.round(p2.x))),
          y: Math.min(imageHeight, Math.max(0, Math.round(p2.y))),
        }];
        onChange(region);
      }
    },
    [data.size, onChange],
  );

  const onPathCreate = useCallback(
    (event) => {
      onPathChange(event);
      featureGroupRef.current.clearLayers();
    },
    [onPathChange],
  );

  const onPathEdit = onPathChange;

  const onPathDeleted = useCallback(
    () => {
      if (onChange) {
        onChange(null);
      }
    },
    [onChange],
  );

  useEffect(
    () => {
      L.EditToolbar.Delete.include({
        enable: () => {
          // eslint-disable-next-line react/no-this-in-sfc
          featureGroupRef.current.clearLayers();
          onPathDeleted();
        },
      });
    },
    [onPathDeleted],
  );

  useEffect(
    () => {
      if (!map?.options?.crs) {
        return;
      }

      const fixedValue = (value || []).filter((el) => el?.x >= 0 && el?.y >=0);
      if (fixedValue.length !== 2) {
        featureGroupRef.current.clearLayers();
        setRectangleBounds(null);
        return;
      }

      const { maxZoom } = omeroLayerRef.current;
      const p1 = L.point(value[0].x, value[0].y);
      const p2 = L.point(value[1].x, value[1].y);
      const latlng1 = map.options.crs.pointToLatLng(p1, maxZoom);
      const latlng2 = map.options.crs.pointToLatLng(p2, maxZoom);
      const bounds = [latlng1, latlng2];

      setRectangleBounds(bounds);
    },
    [map, value],
  );

  useEffect(
    () => {
      if (!map?.options?.crs || !results) {
        return;
      }

      const _centroids = [];
      let minRadius;
      let maxRadius;
      const { maxZoom } = omeroLayerRef.current;
      // [, label, centroid-0, centroid-1, 0],
      const [, , , ...channelNames] = results[0];
      let channelIndexes = [];
      channelNames.forEach((channelName, index) => {
        channels.forEach((channel, ind) => {
          if (channel.label === channelName) {
            channelIndexes.push(ind);
          }
        });
      });

      results.forEach((item, index) => {
        if (index === 0) {
          return;
        }
        const [, x, y, ...itemTail] = item;
        if (x === undefined || y === undefined) {
          return;
        }

        const p = L.point(x, y);
        const center = map.options.crs.pointToLatLng(p, maxZoom);

        channelIndexes.forEach((channelIndex, i) => {
          minRadius = Math.min(minRadius ?? itemTail[i], itemTail[i]);
          maxRadius = Math.max(maxRadius ?? itemTail[i], itemTail[i]);

          _centroids.push({
            center,
            radius: itemTail[i],
            color: channels[channelIndex].color,
          });
        });
      });

      const radius = scaleLinear().domain([minRadius, maxRadius]).range([2, 5]);
      setCentroids(_centroids.map((item) => ({ ...item, radius: radius(item.radius) })));
    },
    [map, channels, results],
  );

  return (
    <Container className={classNames(className, 'image-viewer', { editable, 'with-rectangle': rectangleBounds })}>
      <MapContainer
        crs={L.CRS.Simple}
        center={[0, 0]}
        minZoom={0}
        maxZoom={5}
        zoom={0}
        attributionControl={false}
        zoomControl={false}
        whenCreated={setMap}
      >
        {data && channels && baseUrl && (
          <OmeroLayer
            ref={omeroLayerRef}
            data={data}
            options={{
              baseUrl,
              channels,
            }}
          />
        )}

        {image && imageLatLngBounds && (
          <ImageOverlay
            url={image}
            bounds={imageLatLngBounds}
            zIndex={10}
          />
        )}

        {(centroids || []).map((item, i) => (
          <Circle
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            center={item.center}
            radius={item.radius}
            pathOptions={{ color: item.color }}
            fillColor={item.color}
          />
        ))}

        <FullscreenControl position="topright" />

        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            draw={{
              // see: https://leaflet.github.io/Leaflet.draw/docs/leaflet-draw-latest.html#drawoptions
              polyline: false,
              polygon: false,
              rectangle: true,
              circle: false,
              marker: false,
              circlemarker: false,
            }}
            edit={{ edit: true, remove: true }}
            onEdited={onPathEdit}
            onCreated={onPathCreate}
            onDeleted={onPathDeleted}
          />
          {rectangleBounds && <Rectangle bounds={rectangleBounds} />}
        </FeatureGroup>

        <ZoomControl position="bottomright" />
        <ResetZoomControl position="bottomright" />
      </MapContainer>

      <SideBar
        $width="300px"
        $collapsed={sidebarCollapsed}
        onMouseEnter={onSidebarMouseEnter}
        onMouseLeave={onSidebarMouseLeave}
      >
        <SidebarToggle
          type="button"
          onClick={toggleSidebar}
        >
          <SideBarToggleIcon />
        </SidebarToggle>

        <Channels>
          {(channels || []).map((channel, index) => (
            <Channel key={channel.label}>
              <Checkbox
                id={`checkbox-${index}-${channel.color}`}
                name={`checkbox-${index}-${channel.color}`}
                $color={`#${channel.color}`}
                checked={channel.active}
                onChange={onChannelToggle(index)}
              />
              <ChannelLabel>{channel.label}</ChannelLabel>
              <Slider
                $color={`#${channel.color}`}
                min={channel.window.min}
                max={channel.window.max}
                value={[channel.window.start, channel.window.end]}
                onChange={onChannelRangeChange(index)}
                valueLabelDisplay="auto"
                aria-labelledby="range-slider"
                disabled={!channel.active}
              />
            </Channel>
          ))}
        </Channels>
      </SideBar>
    </Container>
  );
};

ImageViewer.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  className: PropTypes.string,
  /**
   * Image for canvas layer.
   */
  image: PropTypes.string,
  /**
   * Omero image data object
   */
  data: PropTypes.shape({
    channels: PropTypes.arrayOf(PropTypes.shape({})),
    size: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),
  }),
  results: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string,PropTypes.number]))),
  /**
   * Selected area value [{ x1, y1 }, { x2, y2 }]
   */
  value: PropTypes.arrayOf(PropTypes.shape({ x: PropTypes.number, y: PropTypes.number })),
  /**
   * If true, edit controls will be displayed (selection of an area on the image).
   */
  editable: PropTypes.bool,
  /**
   * A callback fired when selected area changed.
   */
  onChange: PropTypes.func,
};

ImageViewer.defaultProps = {
  className: '',
  image: null,
  data: {},
  results: null,
  value: null,
  editable: false,
  onChange: null,
};

export default ImageViewer;
