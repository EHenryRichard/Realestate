CREATE TABLE faqs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    question    TEXT        NOT NULL,
    answer      TEXT,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    is_visible  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_faqs_visible    ON faqs(is_visible);
CREATE INDEX idx_faqs_sort_order ON faqs(sort_order);

INSERT INTO faqs (question, sort_order) VALUES
    ('How do I verify land documents in Warri and Delta State?', 1),
    ('What areas does Sureboy Realty cover?',                    2),
    ('How do I buy land or property in Warri, Delta State?',     3),
    ('What real estate services does Sureboy Realty offer?',     4),
    ('How do I list my property with Sureboy Realty?',           5),
    ('How do I book a free property consultation?',              6);
