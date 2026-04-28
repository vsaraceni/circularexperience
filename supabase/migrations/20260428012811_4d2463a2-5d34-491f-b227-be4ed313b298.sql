UPDATE lead_sources
SET cors_origins = ARRAY['https://experience.movimentocircular.io', 'https://circularexperience.lovable.app'],
    updated_at = now()
WHERE slug = 'lp_ce';