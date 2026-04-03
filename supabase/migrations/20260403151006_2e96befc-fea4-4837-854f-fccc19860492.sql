
-- Users with 'user' role can read leads
CREATE POLICY "Users can read leads"
ON public.leads FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can update leads
CREATE POLICY "Users can update leads"
ON public.leads FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can read activities
CREATE POLICY "Users can read activities"
ON public.lead_activities FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can insert activities
CREATE POLICY "Users can insert activities"
ON public.lead_activities FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can manage follow-ups
CREATE POLICY "Users can read follow-ups"
ON public.lead_follow_ups FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

CREATE POLICY "Users can insert follow-ups"
ON public.lead_follow_ups FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

CREATE POLICY "Users can update follow-ups"
ON public.lead_follow_ups FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can read proposals
CREATE POLICY "Users can read proposals"
ON public.proposals FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can create proposals
CREATE POLICY "Users can create proposals"
ON public.proposals FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can update proposals
CREATE POLICY "Users can update proposals"
ON public.proposals FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can manage proposal submissions
CREATE POLICY "Users can read submissions"
ON public.proposal_submissions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

CREATE POLICY "Users can insert submissions"
ON public.proposal_submissions FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));

-- Users can insert notifications (needed for triggers)
CREATE POLICY "Users insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()));

-- Users can read all profiles (for display names in CRM)
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'user'));
