import fetch from 'isomorphic-fetch'
import {flatten, sortedUniqBy, sortBy} from 'lodash'

const DEFAULT_SEGMENT_DOMAIN = 'cdn.segment.com'

async function fetchDestinationForWriteKey(writeKey, segmentDomain) {
  const res = await fetch(
    `https://${segmentDomain}/v1/projects/${writeKey}/integrations`
  )

  if (!res.ok) {
    throw new Error(
      `Failed to fetch integrations for write key ${writeKey}: HTTP ${
        res.status
      } ${res.statusText}`
    )
  }

  const destinations = await res.json()

  // Rename creationName to id to abstract the weird data model
  for (const destination of destinations) {
    destination.id = destination.creationName
    delete destination.creationName
  }

  return destinations
}

export default async function fetchDestinations(
  writeKeys,
  segmentDomain = DEFAULT_SEGMENT_DOMAIN
) {
  const destinationsRequests = []
  for (const writeKey of writeKeys) {
    destinationsRequests.push(
      fetchDestinationForWriteKey(writeKey, segmentDomain)
    )
  }

  let destinations = flatten(await Promise.all(destinationsRequests))
  // Remove the dummy Repeater destination
  destinations = destinations.filter(d => d.id !== 'Repeater')
  destinations = sortBy(destinations, ['id'])
  destinations = sortedUniqBy(destinations, 'id')

  return destinations
}
