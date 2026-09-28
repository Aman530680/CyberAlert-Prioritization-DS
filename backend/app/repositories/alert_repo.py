"""
CyberAlert-Prioritization: Optimized SQL Repository
Executes parameterized MySQL queries with indexing for paginated searches and aggregations.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from backend.app.models.alert import AlertORM, AlertFeatureORM


class AlertRepository:

    @staticmethod
    def get_paginated_alerts(
        db: Session,
        page: int = 1,
        page_size: int = 25,
        severity: Optional[str] = None,
        priority: Optional[str] = None,
        alert_type: Optional[str] = None,
        source: Optional[str] = None,
        affected_system: Optional[str] = None,
        noise_level: Optional[str] = None,
        is_incident: Optional[bool] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves paginated alerts with flexible dynamic filtering using indexed fields.
        """
        where_clauses = ["1=1"]
        params = {}

        if severity:
            where_clauses.append("severity = :severity")
            params["severity"] = severity.lower()
        if priority:
            where_clauses.append("priority = :priority")
            params["priority"] = priority.upper()
        if alert_type:
            where_clauses.append("alert_type = :alert_type")
            params["alert_type"] = alert_type
        if source:
            where_clauses.append("source = :source")
            params["source"] = source
        if affected_system:
            where_clauses.append("affected_system LIKE :affected_system")
            params["affected_system"] = f"%{affected_system}%"
        if noise_level:
            where_clauses.append("noise_level = :noise_level")
            params["noise_level"] = noise_level.upper()
        if is_incident is not None:
            where_clauses.append("is_incident = :is_incident")
            params["is_incident"] = 1 if is_incident else 0
        if date_from:
            where_clauses.append("timestamp >= :date_from")
            params["date_from"] = date_from
        if date_to:
            where_clauses.append("timestamp <= :date_to")
            params["date_to"] = date_to
        if search:
            where_clauses.append("(alert_id LIKE :search OR alert_type LIKE :search OR affected_system LIKE :search OR description LIKE :search)")
            params["search"] = f"%{search}%"

        where_sql = " AND ".join(where_clauses)

        # Count total
        count_sql = f"SELECT COUNT(*) FROM alerts WHERE {where_sql}"
        total = db.execute(text(count_sql), params).scalar() or 0

        # Fetch records
        offset = (page - 1) * page_size
        params["limit"] = page_size
        params["offset"] = offset

        fetch_sql = f"""
            SELECT id, alert_id, timestamp, event_type, source, severity,
                   alert_type, category, affected_system, asset_category,
                   user_id, src_ip, dst_ip, risk_score, confidence, geo_location,
                   is_anomaly, mitre_technique, is_incident, incident_probability,
                   noise_score, noise_level, priority, resolution_status, description
            FROM alerts
            WHERE {where_sql}
            ORDER BY timestamp DESC
            LIMIT :limit OFFSET :offset
        """
        rows = db.execute(text(fetch_sql), params).mappings().all()

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "items": [dict(r) for r in rows]
        }

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: str) -> Optional[Dict[str, Any]]:
        """Returns single alert record joined with feature vector and repetition context."""
        query = text("""
            SELECT a.*, 
                   f.hour, f.day_of_week, f.business_hours, f.night_time,
                   f.repeated_alert_count, f.alert_burst_score,
                   f.time_since_previous_similar_alert, f.source_alert_frequency,
                   f.system_alert_frequency, f.alert_type_frequency, f.severity_weight
            FROM alerts a
            LEFT JOIN alert_features f ON a.alert_id = f.alert_id
            WHERE a.alert_id = :alert_id
        """)
        row = db.execute(query, {"alert_id": alert_id}).mappings().first()
        return dict(row) if row else None

    @staticmethod
    def get_overview_stats(db: Session) -> Dict[str, Any]:
        """Calculates dashboard overview metrics from MySQL."""
        query = text("""
            SELECT 
                COUNT(*) as total_alerts,
                SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as total_incidents,
                SUM(CASE WHEN severity IN ('critical', 'emergency') THEN 1 ELSE 0 END) as critical_alerts,
                SUM(CASE WHEN priority IN ('CRITICAL', 'HIGH') THEN 1 ELSE 0 END) as high_priority_alerts,
                SUM(CASE WHEN noise_level = 'HIGH' THEN 1 ELSE 0 END) as high_noise_alerts,
                MIN(timestamp) as min_ts,
                MAX(timestamp) as max_ts
            FROM alerts;
        """)
        row = db.execute(query).mappings().first()
        total = row["total_alerts"] or 0
        incidents = row["total_incidents"] or 0
        rate = round((incidents / total) * 100, 2) if total > 0 else 0.0

        return {
            "total_alerts": total,
            "total_incidents": int(incidents),
            "incident_rate": rate,
            "critical_alerts": int(row["critical_alerts"] or 0),
            "high_priority_alerts": int(row["high_priority_alerts"] or 0),
            "high_noise_alerts": int(row["high_noise_alerts"] or 0),
            "date_range_start": row["min_ts"].isoformat() if row["min_ts"] else "N/A",
            "date_range_end": row["max_ts"].isoformat() if row["max_ts"] else "N/A"
        }

    @staticmethod
    def get_filter_options(db: Session) -> Dict[str, List[str]]:
        """Returns distinct filter dropdown values from database."""
        def fetch_distinct(col):
            res = db.execute(text(f"SELECT DISTINCT {col} FROM alerts WHERE {col} IS NOT NULL ORDER BY {col};")).scalars().all()
            return [str(x) for x in res if x]

        return {
            "severities": ["emergency", "critical", "high", "medium", "low", "info"],
            "priorities": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            "alert_types": fetch_distinct("alert_type")[:50],
            "sources": fetch_distinct("source")[:30],
            "noise_levels": ["HIGH", "MEDIUM", "LOW"],
            "asset_categories": fetch_distinct("asset_category")
        }

    @staticmethod
    def get_alert_trends(db: Session) -> Dict[str, Any]:
        """Calculates volume over time, hourly distributions, and burst events."""
        # Daily trend (sampled/grouped by day)
        daily_query = text("""
            SELECT DATE(timestamp) as day_date, COUNT(*) as alert_count,
                   SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as incident_count
            FROM alerts
            GROUP BY DATE(timestamp)
            ORDER BY day_date ASC;
        """)
        daily_rows = db.execute(daily_query).mappings().all()

        # Hourly distribution
        hourly_query = text("""
            SELECT HOUR(timestamp) as hr, COUNT(*) as count,
                   SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as incident_count
            FROM alerts
            GROUP BY HOUR(timestamp)
            ORDER BY hr ASC;
        """)
        hourly_rows = db.execute(hourly_query).mappings().all()

        # Burst count by day
        burst_query = text("""
            SELECT priority, COUNT(*) as count
            FROM alerts
            GROUP BY priority;
        """)
        prio_rows = db.execute(burst_query).mappings().all()

        return {
            "daily_trends": [
                {
                    "date": str(r["day_date"]),
                    "alert_count": int(r["alert_count"]),
                    "incident_count": int(r["incident_count"])
                }
                for r in daily_rows
            ],
            "hourly_trends": [
                {
                    "hour": int(r["hr"]),
                    "alert_count": int(r["count"]),
                    "incident_count": int(r["incident_count"])
                }
                for r in hourly_rows
            ],
            "priority_breakdown": {str(r["priority"]): int(r["count"]) for r in prio_rows}
        }

    @staticmethod
    def get_alert_types_analysis(db: Session, top_n: int = 15) -> List[Dict[str, Any]]:
        """Computes top alert types with incident conversion rate."""
        query = text(f"""
            SELECT 
                alert_type,
                COUNT(*) as total_alerts,
                SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as incident_count,
                ROUND(AVG(incident_probability) * 100, 2) as avg_model_prob,
                ROUND(AVG(noise_score), 2) as avg_noise_score
            FROM alerts
            GROUP BY alert_type
            ORDER BY total_alerts DESC
            LIMIT {top_n};
        """)
        rows = db.execute(query).mappings().all()
        res = []
        for r in rows:
            tot = int(r["total_alerts"])
            inc = int(r["incident_count"])
            rate = round((inc / tot) * 100, 2) if tot > 0 else 0.0
            res.append({
                "alert_type": r["alert_type"],
                "total_alerts": tot,
                "incident_count": inc,
                "incident_rate": rate,
                "avg_model_prob": float(r["avg_model_prob"] or 0.0),
                "avg_noise_score": float(r["avg_noise_score"] or 0.0)
            })
        return res

    @staticmethod
    def get_severity_analysis(db: Session) -> List[Dict[str, Any]]:
        """Severity distribution and incident rate."""
        query = text("""
            SELECT 
                severity,
                COUNT(*) as total_alerts,
                SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as incident_count,
                ROUND(AVG(incident_probability) * 100, 2) as avg_prob
            FROM alerts
            GROUP BY severity;
        """)
        rows = db.execute(query).mappings().all()
        lookup = {r["severity"].lower(): r for r in rows}
        res = []
        for s in ["emergency", "critical", "high", "medium", "low", "info"]:
            if s in lookup:
                r = lookup[s]
                tot = int(r["total_alerts"])
                inc = int(r["incident_count"])
                res.append({
                    "severity": s,
                    "total_alerts": tot,
                    "incident_count": inc,
                    "incident_rate": round((inc / tot) * 100, 2) if tot > 0 else 0.0,
                    "avg_probability": float(r["avg_prob"] or 0.0)
                })
        return res

    @staticmethod
    def get_source_analysis(db: Session, top_n: int = 15) -> List[Dict[str, Any]]:
        """SIEM and EDR detection sources intelligence."""
        query = text(f"""
            SELECT 
                source,
                COUNT(*) as total_alerts,
                SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as incident_count,
                SUM(CASE WHEN noise_level = 'HIGH' THEN 1 ELSE 0 END) as noise_count
            FROM alerts
            GROUP BY source
            ORDER BY total_alerts DESC
            LIMIT {top_n};
        """)
        rows = db.execute(query).mappings().all()
        res = []
        for r in rows:
            tot = int(r["total_alerts"])
            inc = int(r["incident_count"])
            res.append({
                "source": r["source"],
                "total_alerts": tot,
                "incident_count": inc,
                "incident_rate": round((inc / tot) * 100, 2) if tot > 0 else 0.0,
                "high_noise_alerts": int(r["noise_count"])
            })
        return res

    @staticmethod
    def get_system_intelligence(db: Session, top_n: int = 15) -> List[Dict[str, Any]]:
        """Asset risk and affected systems intelligence."""
        query = text(f"""
            SELECT 
                affected_system,
                asset_category,
                COUNT(*) as total_alerts,
                SUM(CASE WHEN is_incident = 1 THEN 1 ELSE 0 END) as incident_count,
                ROUND(AVG(incident_probability) * 100, 2) as avg_prob
            FROM alerts
            GROUP BY affected_system, asset_category
            ORDER BY total_alerts DESC
            LIMIT {top_n};
        """)
        rows = db.execute(query).mappings().all()
        res = []
        for r in rows:
            tot = int(r["total_alerts"])
            inc = int(r["incident_count"])
            res.append({
                "affected_system": r["affected_system"],
                "asset_category": r["asset_category"],
                "total_alerts": tot,
                "incident_count": inc,
                "incident_rate": round((inc / tot) * 100, 2) if tot > 0 else 0.0,
                "avg_probability": float(r["avg_prob"] or 0.0)
            })
        return res

    @staticmethod
    def get_noise_analysis_summary(db: Session) -> Dict[str, Any]:
        """Distribution of Noise Levels and top noisy signatures."""
        dist_query = text("""
            SELECT noise_level, COUNT(*) as count, ROUND(AVG(noise_score), 2) as avg_score
            FROM alerts
            GROUP BY noise_level;
        """)
        dist_rows = db.execute(dist_query).mappings().all()

        noisy_types_query = text("""
            SELECT alert_type, COUNT(*) as total, ROUND(AVG(noise_score), 2) as noise_score
            FROM alerts
            WHERE noise_level = 'HIGH'
            GROUP BY alert_type
            ORDER BY total DESC
            LIMIT 10;
        """)
        noisy_types = db.execute(noisy_types_query).mappings().all()

        return {
            "noise_level_distribution": {
                str(r["noise_level"]): {"count": int(r["count"]), "avg_score": float(r["avg_score"])}
                for r in dist_rows
            },
            "top_noisy_alert_types": [
                {"alert_type": r["alert_type"], "high_noise_count": int(r["total"]), "avg_noise_score": float(r["noise_score"])}
                for r in noisy_types
            ]
        }
