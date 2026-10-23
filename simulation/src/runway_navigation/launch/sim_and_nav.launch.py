import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, TimerAction
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    pkg_nav = get_package_share_directory('runway_navigation')
    pkg_desc = get_package_share_directory('runway_description')

    world_name = LaunchConfiguration('world_name')
    use_rviz = LaunchConfiguration('use_rviz')
    use_ekf = LaunchConfiguration('use_ekf')
    use_c2_bridge = LaunchConfiguration('use_c2_bridge')
    spawn_x = LaunchConfiguration('spawn_x')
    spawn_y = LaunchConfiguration('spawn_y')
    spawn_yaw = LaunchConfiguration('spawn_yaw')

    world_name_arg = DeclareLaunchArgument(
        'world_name',
        default_value='nus_ea_field',
        description='Simulation world name: "nus_ea_field" or "airport_runway"'
    )

    use_rviz_arg = DeclareLaunchArgument(
        'use_rviz',
        default_value='true',
        description='Launch RViz2 if true'
    )

    use_ekf_arg = DeclareLaunchArgument(
        'use_ekf',
        default_value='true',
        description='Launch RTK-GNSS + IMU Dual-EKF localization pipeline if true'
    )

    use_c2_bridge_arg = DeclareLaunchArgument(
        'use_c2_bridge',
        default_value='true',
        description='Launch UGV C2 Bridge node (vacuum & telemetry executive) if true'
    )

    spawn_x_arg = DeclareLaunchArgument(
        'spawn_x',
        default_value='-25.0',
        description='Robot spawn X coordinate (default: -25.0)'
    )

    spawn_y_arg = DeclareLaunchArgument(
        'spawn_y',
        default_value='0.0',
        description='Robot spawn Y coordinate (default: 0.0)'
    )

    spawn_yaw_arg = DeclareLaunchArgument(
        'spawn_yaw',
        default_value='0.0',
        description='Robot spawn Yaw angle (default: 0.0)'
    )

    # 1. Gazebo Simulation launcher (Spawns world, UGV model, sensor bridges, /clock)
    gazebo_sim = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_desc, 'launch', 'sim.launch.py')
        ),
        launch_arguments={
            'world_name': world_name,
            'spawn_x': spawn_x,
            'spawn_y': spawn_y,
            'spawn_yaw': spawn_yaw,
        }.items()
    )

    # 2. Nav2 Autonomous Navigation + RViz2 + C2 Bridge Node
    # Delayed by 3.5 seconds to give Gazebo Harmonic time to initialize /clock and GUI
    nav2_bringup = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav, 'launch', 'bringup_nav2.launch.py')
        ),
        launch_arguments={
            'world_name': world_name,
            'use_rviz': use_rviz,
            'use_ekf': use_ekf,
            'use_c2_bridge': use_c2_bridge,
            'spawn_x': spawn_x,
            'spawn_y': spawn_y,
            'spawn_yaw': spawn_yaw,
        }.items()
    )

    delayed_nav2 = TimerAction(
        period=3.5,
        actions=[nav2_bringup]
    )

    return LaunchDescription([
        world_name_arg,
        use_rviz_arg,
        use_ekf_arg,
        use_c2_bridge_arg,
        spawn_x_arg,
        spawn_y_arg,
        spawn_yaw_arg,
        gazebo_sim,
        delayed_nav2,
    ])
