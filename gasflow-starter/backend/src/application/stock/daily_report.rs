use crate::domain::error::DomainError;
use crate::domain::stock::DailyOperationalReport;
use crate::ports::stock_port::StockPort;
use chrono::{NaiveDate, Utc};

pub async fn execute<P: StockPort>(
    port: &P,
    date: Option<NaiveDate>,
) -> Result<DailyOperationalReport, DomainError> {
    let report_date = date.unwrap_or_else(|| Utc::now().date_naive());
    let totals = port.daily_report_totals(report_date).await?;

    Ok(DailyOperationalReport {
        date: report_date,
        entregas_dia: totals.deliveries_count,
        llenas_entregadas: totals.delivered_full,
        vacias_recibidas: totals.recovered_empty,
        pendiente: totals.delivered_full - totals.recovered_empty,
    })
}
