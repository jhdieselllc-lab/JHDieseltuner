namespace JHDiesel.Communication;

public enum AdapterFamily { Rp1210, J2534, JHLink }

public sealed record AdapterDescriptor(string Id, string DisplayName, AdapterFamily Family,
    string DriverVersion, IReadOnlyList<string> Transports);

public sealed record VehicleIdentity(string? Vin, string? Manufacturer, string? ControllerName,
    string? HardwareNumber, string? SoftwareNumber, string? CalibrationId);

public sealed record DiagnosticTroubleCode(string Code, string Status, string? Description);

/// <summary>Read-only boundary for approved vendor adapter implementations.</summary>
public interface IReadOnlyVehicleAdapter
{
    AdapterFamily Family { get; }
    Task<IReadOnlyList<AdapterDescriptor>> DiscoverAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<VehicleIdentity>> DiscoverModulesAsync(AdapterDescriptor adapter,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<DiagnosticTroubleCode>> ReadTroubleCodesAsync(AdapterDescriptor adapter,
        string controllerId, CancellationToken cancellationToken);
}
