-- Enhanced forum setup with user authentication, profiles, categories, and moderation

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables for the forum

-- Users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_admin BOOLEAN DEFAULT false,
    is_moderator BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories table
CREATE TABLE public.categories (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Threads table (enhanced)
CREATE TABLE public.threads (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id),
    category_id BIGINT REFERENCES public.categories(id),
    post_count INTEGER DEFAULT 1,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Posts table (enhanced)
CREATE TABLE public.posts (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Moderation actions table
CREATE TABLE public.moderation_actions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    moderator_id UUID NOT NULL REFERENCES public.users(id),
    action_type TEXT NOT NULL, -- 'delete_post', 'lock_thread', 'ban_user', etc.
    target_type TEXT NOT NULL, -- 'post', 'thread', 'user', etc.
    target_id TEXT NOT NULL, -- ID of the target (post ID, thread ID, user ID, etc.)
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User sessions table
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User preferences table
CREATE TABLE public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    theme TEXT DEFAULT 'default',
    timezone TEXT DEFAULT 'UTC',
    posts_per_page INTEGER DEFAULT 20,
    signature TEXT,
    show_online_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Thread subscriptions table
CREATE TABLE public.thread_subscriptions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    thread_id BIGINT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    notification_type TEXT DEFAULT 'all', -- 'all', 'mentions', 'none'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, thread_id)
);

-- User notifications table
CREATE TABLE public.notifications (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'thread_reply', 'mention', 'moderation', etc.
    content TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Private messages table
CREATE TABLE public.private_messages (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES public.users(id),
    recipient_id UUID NOT NULL REFERENCES public.users(id),
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User reputation table
CREATE TABLE public.user_reputation (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reputation_points INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Newbie',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Post reactions table
CREATE TABLE public.post_reactions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL, -- 'like', 'love', 'laugh', 'thanks', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_id, user_id, reaction_type)
);

-- Thread tags table
CREATE TABLE public.tags (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Thread-tag relationship table
CREATE TABLE public.thread_tags (
    thread_id BIGINT NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (thread_id, tag_id)
);

-- User activity log
CREATE TABLE public.user_activity (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'login', 'post_create', 'thread_create', etc.
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Content reports table
CREATE TABLE public.content_reports (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES public.users(id),
    content_type TEXT NOT NULL, -- 'post', 'thread', 'user', etc.
    content_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'rejected'
    moderator_id UUID REFERENCES public.users(id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- User bans table
CREATE TABLE public.user_bans (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES public.users(id),
    reason TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_permanent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_posts_thread_id ON public.posts(thread_id);
CREATE INDEX idx_threads_category_id ON public.threads(category_id);
CREATE INDEX idx_threads_user_id ON public.threads(user_id);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_threads_created_at ON public.threads(created_at DESC);
CREATE INDEX idx_posts_created_at ON public.posts(created_at);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX idx_thread_subscriptions_user_id ON public.thread_subscriptions(user_id);
CREATE INDEX idx_thread_subscriptions_thread_id ON public.thread_subscriptions(thread_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_private_messages_sender_id ON public.private_messages(sender_id);
CREATE INDEX idx_private_messages_recipient_id ON public.private_messages(recipient_id);
CREATE INDEX idx_private_messages_is_read ON public.private_messages(is_read);
CREATE INDEX idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX idx_thread_tags_tag_id ON public.thread_tags(tag_id);
CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at);
CREATE INDEX idx_content_reports_status ON public.content_reports(status);
CREATE INDEX idx_user_bans_user_id ON public.user_bans(user_id);
CREATE INDEX idx_user_bans_expires_at ON public.user_bans(expires_at);

-- Create triggers

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_reputation_updated_at BEFORE UPDATE ON public.user_reputation FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a trigger to automatically subscribe thread creator to their thread
CREATE OR REPLACE FUNCTION auto_subscribe_thread_creator()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.thread_subscriptions (user_id, thread_id)
    VALUES (NEW.user_id, NEW.id)
    ON CONFLICT (user_id, thread_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER thread_creator_subscription AFTER INSERT ON public.threads
FOR EACH ROW EXECUTE PROCEDURE auto_subscribe_thread_creator();

-- Create a trigger to automatically process mentions in posts
CREATE OR REPLACE FUNCTION process_post_mentions()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.process_mentions(NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER post_mentions_processor AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE process_post_mentions();

-- Create a trigger to automatically notify subscribers when a new post is created
CREATE OR REPLACE FUNCTION notify_on_new_post()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.notify_thread_subscribers(NEW.thread_id, NEW.id, NEW.user_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER post_notification_trigger AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE notify_on_new_post();

-- Create a trigger to automatically increment post count when a new post is created
CREATE OR REPLACE FUNCTION increment_thread_post_count()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.increment_post_count(NEW.thread_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER post_count_incrementer AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE increment_thread_post_count();

-- Create a trigger to automatically log user activity
CREATE OR REPLACE FUNCTION log_user_activity_on_post()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_user_activity(NEW.user_id, 'post_create');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER post_activity_logger AFTER INSERT ON public.posts
FOR EACH ROW EXECUTE PROCEDURE log_user_activity_on_post();

-- Create a trigger to automatically log user activity for thread creation
CREATE OR REPLACE FUNCTION log_user_activity_on_thread()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.log_user_activity(NEW.user_id, 'thread_create');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER thread_activity_logger AFTER INSERT ON public.threads
FOR EACH ROW EXECUTE PROCEDURE log_user_activity_on_thread();

-- Insert sample data for new tables
INSERT INTO public.tags (name, slug, description)
VALUES 
    ('Retro', 'retro', 'Discussions about retro computing and web design'),
    ('Windows 98', 'windows-98', 'Windows 98 related topics'),
    ('Web 1.0', 'web-1-0', 'The original web experience'),
    ('Help', 'help', 'Questions and help requests'),
    ('Showcase', 'showcase', 'Show off your retro-inspired creations');

-- Insert sample thread tags
DO $$
DECLARE
    thread1_id BIGINT;
    thread2_id BIGINT;
    thread3_id BIGINT;
    thread4_id BIGINT;
    
    retro_tag_id BIGINT;
    win98_tag_id BIGINT;
    web10_tag_id BIGINT;
    showcase_tag_id BIGINT;
BEGIN
    -- Get thread IDs
    SELECT id INTO thread1_id FROM public.threads WHERE title = 'Welcome to THE UNDERWEB Forum' LIMIT 1;
    SELECT id INTO thread2_id FROM public.threads WHERE title = 'Retro Web Design Tips' LIMIT 1;
    SELECT id INTO thread3_id FROM public.threads WHERE title = 'Share Your Favorite Web 1.0 Sites' LIMIT 1;
    SELECT id INTO thread4_id FROM public.threads WHERE title = 'Windows 98 Aesthetic Appreciation' LIMIT 1;
    
    -- Get tag IDs
    SELECT id INTO retro_tag_id FROM public.tags WHERE slug = 'retro';
    SELECT id INTO win98_tag_id FROM public.tags WHERE slug = 'windows-98';
    SELECT id INTO web10_tag_id FROM public.tags WHERE slug = 'web-1-0';
    SELECT id INTO showcase_tag_id FROM public.tags WHERE slug = 'showcase';
    
    -- Insert thread tags
    IF thread1_id IS NOT NULL AND retro_tag_id IS NOT NULL THEN
        INSERT INTO public.thread_tags (thread_id, tag_id) VALUES (thread1_id, retro_tag_id);
    END IF;
    
    IF thread2_id IS NOT NULL AND retro_tag_id IS NOT NULL THEN
        INSERT INTO public.thread_tags (thread_id, tag_id) VALUES (thread2_id, retro_tag_id);
    END IF;
    
    IF thread2_id IS NOT NULL AND web10_tag_id IS NOT NULL THEN
        INSERT INTO public.thread_tags (thread_id, tag_id) VALUES (thread2_id, web10_tag_id);
    END IF;
    
    IF thread3_id IS NOT NULL AND web10_tag_id IS NOT NULL THEN
        INSERT INTO public.thread_tags (thread_id, tag_id) VALUES (thread3_id, web10_tag_id);
    END IF;
    
    IF thread3_id IS NOT NULL AND showcase_tag_id IS NOT NULL THEN
        INSERT INTO public.thread_tags (thread_id, tag_id) VALUES (thread3_id, showcase_tag_id);
    END IF;
    
    IF thread4_id IS NOT NULL AND win98_tag_id IS NOT NULL THEN
        INSERT INTO public.thread_tags (thread_id, tag_id) VALUES (thread4_id, win98_tag_id);
    END IF;
    
    IF thread4_id IS NOT NULL AND retro_tag_id IS NOT NULL THEN
        INSERT INTO public.thread_tags (thread_id, tag_id) VALUES (thread4_id, retro_tag_id);
    END IF;
END;
$$;

-- Insert sample user preferences
DO $$
DECLARE
    admin_id UUID;
    mod_id UUID;
    webdesigner_id UUID;
    retrofan_id UUID;
    vaporwave_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO admin_id FROM public.users WHERE username = 'admin';
    SELECT id INTO mod_id FROM public.users WHERE username = 'moderator';
    SELECT id INTO webdesigner_id FROM public.users WHERE username = 'webdesigner98';
    SELECT id INTO retrofan_id FROM public.users WHERE username = 'retrofan';
    SELECT id INTO vaporwave_id FROM public.users WHERE username = 'vaporwaveenthusiast';
    
    -- Insert user preferences
    INSERT INTO public.user_preferences (user_id, theme, signature, show_online_status)
    VALUES 
        (admin_id, 'dark', 'Administrator of THE UNDERWEB', true),
        (mod_id, 'default', 'Forum Moderator', true),
        (webdesigner_id, 'win98', 'Web design enthusiast since 1998', true),
        (retrofan_id, 'default', 'I love everything retro!', false),
        (vaporwave_id, 'vaporwave', 'A E S T H E T I C', true);
    
    -- Insert user reputation
    INSERT INTO public.user_reputation (user_id, reputation_points, level)
    VALUES 
        (admin_id, 1500, 'Elite'),
        (mod_id, 750, 'Veteran'),
        (webdesigner_id, 350, 'Trusted Member'),
        (retrofan_id, 120, 'Active Member'),
        (vaporwave_id, 45, 'Member');
    
    -- Insert thread subscriptions
    INSERT INTO public.thread_subscriptions (user_id, thread_id, notification_type)
    SELECT admin_id, id, 'all' FROM public.threads;
    
    INSERT INTO public.thread_subscriptions (user_id, thread_id, notification_type)
    SELECT mod_id, id, 'all' FROM public.threads;
    
    -- Insert sample post reactions
    INSERT INTO public.post_reactions (post_id, user_id, reaction_type)
    SELECT p.id, u.id, 'like'
    FROM public.posts p
    CROSS JOIN public.users u
    WHERE p.user_id <> u.id
    LIMIT 10;
END;
$$;
