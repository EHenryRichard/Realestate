CREATE TABLE IF NOT EXISTS property_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  poster_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_videos_property_id ON property_videos(property_id);

INSERT INTO property_videos (property_id, video_url, poster_url, sort_order)
SELECT id, video_url, video_poster, 0
FROM properties
WHERE video_url IS NOT NULL AND TRIM(video_url) <> '';

ALTER TABLE properties
DROP COLUMN IF EXISTS video_url,
DROP COLUMN IF EXISTS video_poster;