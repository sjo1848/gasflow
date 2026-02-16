use std::sync::atomic::{AtomicU64, Ordering};

#[derive(Debug, Default)]
pub struct MetricsRegistry {
    requests_total: AtomicU64,
    requests_2xx: AtomicU64,
    requests_4xx: AtomicU64,
    requests_5xx: AtomicU64,
}

impl MetricsRegistry {
    pub fn record_request(&self) {
        self.requests_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_status(&self, status_code: u16) {
        if (200..300).contains(&status_code) {
            self.requests_2xx.fetch_add(1, Ordering::Relaxed);
        } else if (400..500).contains(&status_code) {
            self.requests_4xx.fetch_add(1, Ordering::Relaxed);
        } else if status_code >= 500 {
            self.requests_5xx.fetch_add(1, Ordering::Relaxed);
        }
    }

    pub fn render_prometheus(&self) -> String {
        let requests_total = self.requests_total.load(Ordering::Relaxed);
        let requests_2xx = self.requests_2xx.load(Ordering::Relaxed);
        let requests_4xx = self.requests_4xx.load(Ordering::Relaxed);
        let requests_5xx = self.requests_5xx.load(Ordering::Relaxed);

        format!(
            "# HELP gasflow_http_requests_total Total HTTP requests.\n# TYPE gasflow_http_requests_total counter\ngasflow_http_requests_total {}\n# HELP gasflow_http_responses_total HTTP responses by status family.\n# TYPE gasflow_http_responses_total counter\ngasflow_http_responses_total{{family=\"2xx\"}} {}\ngasflow_http_responses_total{{family=\"4xx\"}} {}\ngasflow_http_responses_total{{family=\"5xx\"}} {}\n",
            requests_total, requests_2xx, requests_4xx, requests_5xx
        )
    }
}
