import React, { ReactElement, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import Layout from '../components/Layout';
import Map from '../components/Map';
import Filters from '../components/Filter';
import { Button } from 'reactstrap';
// Auto generated via Gatsby Develop Plugin. May need to run 'yarn develop' for it to appear
import { FellowDataQuery } from '../../graphql-types';
import { Popup } from 'react-leaflet';
import Marker from 'react-leaflet-enhanced-marker';
import { githubParser } from '../lib/github';
import {
  Fellow,
  FellowType,
  SocialLinks,
  SocialType,
} from '../data/fellow-type';
import { graphql, Link } from 'gatsby';

const LOCATION = {
  lat: 0,
  lng: 0,
};
const CENTER = [LOCATION.lat, LOCATION.lng];
const DEFAULT_ZOOM = 3;

const IndexPage = ({
  data: { allMdx, allImageSharp, allGithubData, githubData: locationData },
}: {
  data: FellowDataQuery;
}) => {
  const githubProfiles = githubParser(allGithubData.nodes[0].data);
  const allProfiles = allMdx.nodes;

  const createClusterCustomIcon = (cluster: { getChildCount: () => void }) => {
    return L.divIcon({
      html: `<span>${cluster.getChildCount()}</span>`,
      className: 'marker-cluster-custom',
      iconSize: L.point(50, 50, true),
    });
  };

  const layers: { [k in string]: boolean } = {};
  githubProfiles.forEach((ele) => {
    layers[ele.pod_id] = true;
  });
  const [showLayers, setShowLayers] = useState(layers);
  // we likely don't want to generate this every render haha
  const markers = useMemo(() => {
    const ret: ReactElement[] = [];
    const alreadyAdded: string[] = [];
    for (const githubProfile of githubProfiles) {
      if (alreadyAdded.includes(githubProfile.username)) continue;
      alreadyAdded.push(githubProfile.username);
      const mdx = allProfiles.find(
        (profile) =>
          profile?.frontmatter?.github?.toLowerCase() ===
          githubProfile.username.toLowerCase(),
      );

      const fellow = new Fellow(
        githubProfile,
        allImageSharp,
        mdx?.frontmatter as FellowType,
        mdx?.body,
        locationData?.fields?.memberLocationMap?.find(
          (loc) =>
            loc?.name?.toLowerCase() === githubProfile.username.toLowerCase(),
        ) || undefined,
      );
      if (!showLayers[fellow.podId]) continue;
      const center = [fellow.lat, fellow.long];
      ret.push(
        <Marker
          position={center}
          key={fellow.name + fellow.lat}
          icon={
            <div className={`${fellow.podId}`}>
              <img
                src={
                  fellow.profilePictureUrl ||
                  allImageSharp.nodes.find((ele) => {
                    if (!ele || !ele.fluid) return false;
                    return ele.fluid.originalName === 'mlh.png';
                  })?.fluid?.src ||
                  'none'
                }
                className={`icon`}
              />
            </div>
          }
        >
          <Popup>
            <MapPopup fellow={fellow} />
          </Popup>
        </Marker>,
      );
    }
    console.log(ret.length);
    return (
      <MarkerClusterGroup
        showCoverageOnHover={false}
        iconCreateFunction={createClusterCustomIcon}
        maxClusterRadius={25}
      >
        {ret}
      </MarkerClusterGroup>
    );
  }, [showLayers, allImageSharp, allMdx]);

  const mapSettings = {
    center: CENTER,
    defaultBaseMap: 'OpenStreetMap',
    zoom: DEFAULT_ZOOM,
  };

  return (
    <Layout pageName="home">
      <Helmet>
        <title>MLH Fellows</title>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.12.0-2/css/all.min.css"
          rel="stylesheet"
        />
      </Helmet>
      <Map {...mapSettings}>{markers}</Map>
      <Filters layers={showLayers} setLayers={setShowLayers} />
    </Layout>
  );
};

function MapPopup({ fellow }: { fellow: Fellow }) {
  const SocialLink = ({ name }: { name: SocialType }) => {
    if (!fellow[name]) return null;
    return (
      <a
        href={`${SocialLinks[name]}/${fellow[name]}`}
        target="_blank"
        rel="noreferrer"
      >
        <i className={`fab fa-${name}`} />
      </a>
    );
  };

  const socialLinks = Object.keys(SocialLinks).map((socialName, i) => (
    <SocialLink name={socialName as SocialType} key={i} />
  ));

  return (
    <div className="profile text-center">
      <div>
        <h4>{fellow.name}</h4>
      </div>
      <div>
        <p>{fellow.bio}</p>
      </div>
      <div className="divider" />
      <div className="social-links">{socialLinks}</div>
      <Link
        to={`/${fellow.github}`}
        state={{
          modal: true,
          noScroll: true,
        }}
      >
        <Button className="mt-4" color={'success'}>
          More Details
        </Button>
      </Link>
    </div>
  );
}

export default IndexPage;

export const profiles = graphql`
  query FellowData {
    allMdx {
      nodes {
        body
        frontmatter {
          bio
          github
          lat
          linkedin
          long
          name
          profilepic
          twitter
        }
      }
    }
    allImageSharp {
      nodes {
        fluid(maxHeight: 100, maxWidth: 100) {
          src
          originalName
        }
      }
    }
    allGithubData {
      nodes {
        data {
          organization {
            teams {
              edges {
                node {
                  members {
                    nodes {
                      avatarUrl
                      bio
                      company
                      email
                      followers {
                        totalCount
                      }
                      following {
                        totalCount
                      }
                      login
                      name
                      twitterUsername
                      url
                      websiteUrl
                      location
                    }
                  }
                  name
                  description
                  avatarUrl
                }
              }
            }
          }
        }
      }
    }
    githubData {
      fields {
        memberLocationMap {
          lat
          long
          name
        }
      }
    }
  }
`;
