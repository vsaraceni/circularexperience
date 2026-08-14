delete from public.lead_activities where lead_id = 'ef861da8-c7a5-4fd7-8230-4c99654fcda1';
delete from public.notifications where lead_id = 'ef861da8-c7a5-4fd7-8230-4c99654fcda1';
delete from public.leads where id = 'ef861da8-c7a5-4fd7-8230-4c99654fcda1';
delete from public.lead_ingest_log where source_slug = 'teste_ingest_tmp';
delete from public.lead_sources where slug = 'teste_ingest_tmp';