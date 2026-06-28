import { useEffect } from "react";

const DRAFT_KEY = "notice_draft_v1";
const ONE_DAY = 24 * 60 * 60 * 1000;

export default function useDraft(data, setData) {

    // Auto Save
    useEffect(() => {
        const timer = setTimeout(() => {
            localStorage.setItem(
                DRAFT_KEY,
                JSON.stringify({
                    data,
                    saved_at: new Date().toISOString(),
                })
            );
        }, 1000);

        return () => clearTimeout(timer);
    }, [data]);

    // Restore Draft
    useEffect(() => {
        const draft = localStorage.getItem(DRAFT_KEY);

        if (!draft) return;

        try {
            const parsed = JSON.parse(draft);

            if (
                parsed.saved_at &&
                Date.now() - new Date(parsed.saved_at).getTime() > ONE_DAY
            ) {
                localStorage.removeItem(DRAFT_KEY);
                return;
            }

            const restore = window.confirm(
                "Unsaved draft found.\n\nRestore it?"
            );

            if (restore) {
                Object.keys(parsed.data).forEach((key) => {
                    setData(key, parsed.data[key]);
                });
            } else {
                localStorage.removeItem(DRAFT_KEY);
            }

        } catch (err) {
            console.error(err);
        }
    }, []);

    // Clear Draft
    function clearDraft() {
        localStorage.removeItem(DRAFT_KEY);
    }

    return {
        clearDraft,
    };
}