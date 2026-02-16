use crate::domain::error::DomainError;
use crate::domain::stock::StockSummary;
use crate::ports::stock_port::StockPort;
use chrono::NaiveDate;

pub async fn execute<P: StockPort>(
    port: &P,
    date: Option<NaiveDate>,
) -> Result<StockSummary, DomainError> {
    let totals = port.stock_totals(date).await?;

    let llenas_disponibles_estimadas = totals.inbound_full - totals.delivered_full;
    let pendientes_recuperar = totals.delivered_full - totals.recovered_empty;

    Ok(StockSummary {
        date,
        llenas_ingresadas: totals.inbound_full,
        llenas_entregadas: totals.delivered_full,
        vacias_recibidas: totals.recovered_empty,
        llenas_disponibles_estimadas,
        vacias_deposito_estimadas: totals.recovered_empty,
        pendientes_recuperar,
    })
}
