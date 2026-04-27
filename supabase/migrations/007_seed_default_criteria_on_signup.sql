-- Seed default assessment criteria when a new user signs up
create or replace function public.seed_default_criteria()
returns trigger as $$
begin
  insert into public.assessment_criteria (user_id, name, dimension, description, sort_order, target_score)
  values
    -- Product Knowledge
    (new.id, 'Market & Customer Understanding', 'product_knowledge', 'Deep knowledge of target customers, their needs, and market dynamics', 1, 7),
    (new.id, 'Data Fluency', 'product_knowledge', 'Ability to leverage quantitative and qualitative data for product decisions', 2, 7),
    (new.id, 'Domain Expertise', 'product_knowledge', 'Understanding of the industry, competitive landscape, and technology trends', 3, 7),
    (new.id, 'Business Acumen', 'product_knowledge', 'Understanding of business models, revenue, and go-to-market strategies', 4, 7),
    (new.id, 'Technical Literacy', 'product_knowledge', 'Sufficient understanding of technology to make informed trade-off decisions', 5, 7),
    -- Process Knowledge
    (new.id, 'Product Discovery', 'process_knowledge', 'Ability to run effective discovery techniques (prototyping, experiments, user research)', 1, 7),
    (new.id, 'Product Delivery', 'process_knowledge', 'Ability to ship reliably through agile practices and cross-functional collaboration', 2, 7),
    (new.id, 'Roadmapping & Prioritization', 'process_knowledge', 'Skills in outcome-based roadmapping and prioritization frameworks', 3, 7),
    (new.id, 'Product Strategy', 'process_knowledge', 'Ability to define and communicate a compelling product vision and strategy', 4, 7),
    (new.id, 'Metrics & Outcomes', 'process_knowledge', 'Defining and tracking meaningful product metrics aligned to business outcomes', 5, 7),
    -- People Skills
    (new.id, 'Stakeholder Management', 'people_skills', 'Effective engagement with executives, partners, and cross-functional leaders', 1, 7),
    (new.id, 'Team Collaboration', 'people_skills', 'Ability to work effectively with engineering, design, and other disciplines', 2, 7),
    (new.id, 'Communication', 'people_skills', 'Clear, persuasive written and verbal communication skills', 3, 7),
    (new.id, 'Leadership & Influence', 'people_skills', 'Ability to lead without authority and influence outcomes through trust', 4, 7),
    (new.id, 'Coaching & Mentoring', 'people_skills', 'Supporting team growth through feedback, mentorship, and knowledge sharing', 5, 7);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_criteria();
